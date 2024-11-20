import {Response} from "express";
import {sendResponseMessage} from "../utils";
import {youtube, youtube_v3} from '@googleapis/youtube'
import {ISODatetime} from "../../../../../../shared/type-utils";
import * as fs from "fs";
import {findYoutubeMatchingTalks, getEventTalks, SimpleTalk, YoutubeVideo} from "../../firestore/services/talk-utils";
import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;
import {DetailedTalk, Talk, TalkAsset} from "../../../../../../shared/daily-schedule.firestore";
import {match, P} from "ts-pattern";
import {resolvedEventFirestorePath} from "../../../../../../shared/utilities/event-utils";



export async function requestRecordingAssetsRefresh(response: Response, pathParams: {eventId: string, spaceToken?: string|undefined}, queryParams: {token: string, dryRun: boolean}) {
  const { eventId, spaceToken } = pathParams;
  if(!process.env.YOUTUBE_API_KEY) {
    throw new Error(`Missing YOUTUBE_API_KEY env variable !`);
  }

  const eventDescriptor = await getEventDescriptor(spaceToken, eventId);

  if(!eventDescriptor.features.recording) {
    throw new Error(`Missing event descriptor ${eventId}'s features.recording configuration !`);
  }

  const recordingConfig = eventDescriptor.features.recording;
  if(recordingConfig.platform !== 'youtube') {
    throw new Error(`Unsupported platform type ${recordingConfig.platform} for eventId=${eventId}`)
  }

  const start = (eventDescriptor.days || []).map(d => d.localDate).sort()[0]

  const eventTalks = await getEventTalks(spaceToken, eventId);
  const filteredEventTalks = eventTalks
    .filter(talk =>
      talk.room
      && !(recordingConfig.notRecordedFormatIds || []).includes(talk.format.id)
      && !(recordingConfig.notRecordedRoomIds || []).includes(talk.room.id)
      && (!recordingConfig.recordedFormatIds || recordingConfig.recordedFormatIds.includes(talk.format.id))
      && (!recordingConfig.recordedRoomIds || recordingConfig.recordedRoomIds.includes(talk.room.id))
      && !talk.isOverflow
      && !talk.title.includes("[OVERFLOW]") // ancestors of isOverflow flag
    );

  try {
    const allMatchingVideos = await fetchAllVideos(recordingConfig.youtubeHandle, `${start}T00:00:00Z`, recordingConfig.ignoreVideosPublishedAfter ? `${recordingConfig.ignoreVideosPublishedAfter}T00:00:00Z`:undefined);

    const simpleTalks: SimpleTalk[] = filteredEventTalks.map(talk => ({
      id: talk.id,
      title: talk.title,
      format: talk.format,
      speakers: talk.speakers.map(sp => ({ fullName: sp.fullName })),
    }));
    const matchingResults = findYoutubeMatchingTalks(simpleTalks, allMatchingVideos, recordingConfig);

    const updatedTalks = (await Promise.all(matchingResults.matchedTalks.map(async matchedTalk => {
      const talkSnapshot = await (db.doc(`${resolvedEventFirestorePath(eventId, spaceToken)}/talks/${matchedTalk.talk.id}`) as DocumentReference<DetailedTalk>).get()
      const maybeTalk = talkSnapshot.data();

      if(maybeTalk) {
        const assetUrl = `https://www.youtube.com/watch?v=${matchedTalk.video.id}`;
        const existingRecording = (maybeTalk.assets || []).find(asset => asset.type === 'recording' && asset.platform === 'youtube' && asset.assetUrl === assetUrl)
        if(!existingRecording) {
          const assets: TalkAsset[] = (maybeTalk.assets || [])
            .filter(asset => asset.type !== 'recording')
            .concat({
              type: 'recording',
              platform: 'youtube',
              createdOn: new Date().toISOString() as ISODatetime,
              assetUrl
            })

          if(!queryParams.dryRun) {
            await talkSnapshot.ref.update({
              assets: assets
            })
          }

          console.log(`Updated talkId=${maybeTalk.id}'s youtube recording url to ${assetUrl} for eventId=${eventId}, spaceToken=${spaceToken}`)
          return maybeTalk;
        }
      }
      return undefined;
    }))).filter(talk => !!talk).map(talk => talk!);

    const updatesSummary = match({ dryRun: queryParams.dryRun, updatedTalks, matchedTalks: matchingResults.matchedTalks })
      .with({ updatedTalks: [] }, ({ dryRun, updatedTalks, matchedTalks }) => `
      No talk URL have been updated out of ${matchedTalks.length} matched talks (should have already been set previously)
      `.trim()
      ).otherwise(({ dryRun, updatedTalks, matchedTalks }) =>
        `${updatedTalks.length} talk URLs${dryRun?' should ':' '}have been updated ${dryRun?'(dry run)':''} (out of ${matchedTalks.length} matched talks): ${updatedTalks.map(t => t.id).join(", ")}`
      )

    const summary = match(matchingResults)
      .with({ unmatchedTalks: [] }, () => ({
        updates: updatesSummary,
        matchings: {
          message: `Every ${eventTalks.length} talks have matched with a video ! So far so good !`,
          unmatchedElements: [],
        },
      })).with({ unmatchedYoutubeVideos: [] }, () => ({
        updates: updatesSummary,
        matchings: {
          message: `Every ${allMatchingVideos.length} matching videos have matched with a talk ! So far so good !`,
          unmatchedElements: [],
        },
      })).otherwise(({ unmatchedYoutubeVideos, unmatchedTalks }) => ({
        updates: updatesSummary,
        matchings: {
          message: `There are ${unmatchedTalks.length} talks and ${unmatchedYoutubeVideos.length} videos which didn't matched`,
          unmatchedElements: [
            ...unmatchedYoutubeVideos.map(video => ({ type: 'Video', label: `${video.title} | ${video.duration} | published: ${video.publishedAt}` })),
            ...unmatchedTalks.map(({talk}) => ({ type: 'Talk', label: `[${talk.id}] ${talk.title} (${talk.speakers.map(sp => sp.fullName).join(", ")})`, format: talk.format.title })),
          ]
        },
      }))

    // Uncomment this in DEV if you want to generate unit tests based on fetched talks & youtube videos
    // generateTestFile(`./test-data/${eventId.toLowerCase()}-talks-and-youtube.ts`, `${eventId.toUpperCase()}_TALKS_AND_YOUTUBE`, matchingResults, filteredEventTalks);

    return sendResponseMessage(response, 200, {
      summary,
      ...matchingResults
    })
  }catch(e) {
    return sendResponseMessage(response, 500, e?.toString() || "");
  }
}

async function fetchAllVideos(channelHandle: string, minPublishedAt: ISODatetime, maxPublishedAt: ISODatetime|undefined): Promise<Array<YoutubeVideo>> {
  // const EXPORTED_FILE_NAME = `/tmp/vids-${channelHandle}.json`
  // const EXPORTED_UNFILTERED_FILE_NAME = `/tmp/unfilteredVids-${channelHandle}.json`
  // // ⬇️ only for testing purposes to avoid consuming too much youtube api calls
  // if(fs.existsSync(EXPORTED_FILE_NAME)) {
  //   return Promise.resolve(JSON.parse(fs.readFileSync(EXPORTED_FILE_NAME).toString()))
  // }

  const yt = youtube("v3")
  const channels = await yt.channels.list({
    auth: process.env.YOUTUBE_API_KEY,
    forHandle: channelHandle,
    part: ['snippet', 'contentDetails']
  })

  if(!channels.data.items?.length) {
    throw new Error(`No youtube channel found matching handle: ${channelHandle}`)
  }
  if(!channels.data.items[0].contentDetails?.relatedPlaylists?.uploads) {
    throw new Error(`No uploads playlist found matching handle: ${channelHandle}`)
  }

  const playlistId = channels.data.items[0].contentDetails.relatedPlaylists.uploads;

  const results: Array<YoutubeVideo> = []
  const unfilteredResults: Array<YoutubeVideo> = []

  let nextPageToken = await requestPaginatedYoutubeVideos(yt, playlistId, undefined, minPublishedAt, maxPublishedAt, results, unfilteredResults);

  while(nextPageToken) {
    nextPageToken = await requestPaginatedYoutubeVideos(yt, playlistId, nextPageToken, minPublishedAt, maxPublishedAt, results, unfilteredResults);
  }

  // fs.writeFileSync(EXPORTED_FILE_NAME, JSON.stringify(results, null, "  "))
  // fs.writeFileSync(EXPORTED_UNFILTERED_FILE_NAME, JSON.stringify(unfilteredResults, null, "  "))

  return results;
}

async function requestPaginatedYoutubeVideos(yt: youtube_v3.Youtube, playlistId: string, nextPageToken: string|undefined, minPublishedAt: ISODatetime, maxPublishedAt: ISODatetime|undefined, results: YoutubeVideo[], unfilteredResults: YoutubeVideo[]) {
  const minTimestamp = Date.parse(minPublishedAt),
    maxTimestamp = maxPublishedAt ? Date.parse(maxPublishedAt) : Date.now();

  const PAGE_SIZE = 50;

  const videosPage = await yt.playlistItems.list({
    auth: process.env.YOUTUBE_API_KEY,
    maxResults: PAGE_SIZE,
    pageToken: nextPageToken,
    part: ['snippet', 'status'],
    playlistId
  })

  const vids = (videosPage.data.items || []).map(vid => ((vid.snippet?.title && vid.snippet?.resourceId?.videoId)?{
    id: vid.snippet.resourceId.videoId,
    publishedAt: vid.snippet.publishedAt,
    title: vid.snippet.title,
  }:undefined)).filter(vid => vid !== undefined).map(vid => vid!);
  console.log(`Fetched ${vids.length} videos !`)

  const vidDetails = await yt.videos.list({
    auth: process.env.YOUTUBE_API_KEY,
    id: vids.map(v => v.id),
    part: ['contentDetails']
  })

  const simpleVids = vids.map((vid, idx) => ({
    ...vid, duration: vidDetails.data.items?.[idx]?.contentDetails?.duration || ""
  }));
  unfilteredResults.push(...simpleVids);

  const filteredVids = simpleVids.filter(vid =>
    !vid.publishedAt
    || (minTimestamp <= Date.parse(vid.publishedAt) && Date.parse(vid.publishedAt) <= maxTimestamp)
  )
  console.log(`Filtered ${simpleVids.length - filteredVids.length} vids based on publish date !`)

  results.push(...filteredVids);

  const tooOldVids = simpleVids.filter(vid =>
    vid.publishedAt && Date.parse(vid.publishedAt) <= minTimestamp
  )

  // stopping to return next page token as soon as we get some "too oldish" videos as it seems they are sorted
  // by publishing date
  return tooOldVids.length ? undefined : videosPage.data.nextPageToken;
}

async function generateTestFile(testFilePath: string, exportedVarName: string, results: ReturnType<typeof findYoutubeMatchingTalks>, talks: Talk[]) {
  const talkById = talks.reduce((talkById, talk) => {
    talkById.set(talk.id, talk);
    return talkById;
  }, new Map<string, Talk>())
  const content = `
import type {TalkMatchingYoutubeTestData} from "./test-data";

export const ${exportedVarName} = ${JSON.stringify({
    expectedMappedTalks: results.matchedTalks.map(mt => ({
      '__score': mt.score, 
      '__talkTitle': mt.talk.title,
      '__speakers': mt.talk.speakers.map(sp => sp.fullName).join(", "),
      '__videoTitle': mt.video.title,
      talkId: mt.talk.id, videoId: mt.video.id
    })),
    expectedUnmappedTalks: results.unmatchedTalks.map(({talk: ut}) => {
      const talk = talkById.get(ut.id)!
      return {
        '__talkTitle': ut.title,
        '__talkFormat': `${talk.format.title} (id=${talk.format.id}, duration=${talk.format.duration})`,
        '__talkRoom': talk.room ? `${talk.room.title} (${talk.room.id})` : undefined,
        '__talkSpeakers': ut.speakers.map(sp => sp.fullName).join(", "),
        talkId: ut.id
      };
    }),
    unmappedYoutubeVideos: results.unmatchedYoutubeVideos.map(vid => ({
      id: vid.id, publishedAt: vid.publishedAt, duration: vid.duration, title: vid.title
    } satisfies YoutubeVideo)),
    youtubeVideos: results.youtubeVideos.map(vid => ({ 
      id: vid.id, publishedAt: vid.publishedAt, duration: vid.duration, title: vid.title
    } satisfies YoutubeVideo)),
    talks: results.talks.map(t => ({
      id: t.id, title: t.title, speakers: t.speakers, format: talkById.get(t.id)!.format, room: talkById.get(t.id)!.room
    })),
  }, null, '  ')} as const satisfies TalkMatchingYoutubeTestData;
  `

  fs.writeFileSync(testFilePath, content);
}
