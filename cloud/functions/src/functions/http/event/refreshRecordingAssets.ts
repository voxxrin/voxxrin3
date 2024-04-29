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
import {DetailedTalk, TalkAsset} from "../../../../../../shared/daily-schedule.firestore";



export async function requestRecordingAssetsRefresh(response: Response, pathParams: {eventId: string}, queryParams: {token: string}) {
  if(!process.env.YOUTUBE_API_KEY) {
    throw new Error(`Missing YOUTUBE_API_KEY env variable !`);
  }

  const eventDescriptor = await getEventDescriptor(pathParams.eventId);

  if(!eventDescriptor.features.recording) {
    throw new Error(`Missing event descriptor ${pathParams.eventId}'s features.recording configuration !`);
  }

  const recordingConfig = eventDescriptor.features.recording;
  if(recordingConfig.platform !== 'youtube') {
    throw new Error(`Unsupported platform type ${recordingConfig.platform} for eventId=${pathParams.eventId}`)
  }

  const start = (eventDescriptor.days || []).map(d => d.localDate).sort()[0]

  const eventTalks = await getEventTalks(pathParams.eventId);
  const filteredEventTalks = eventTalks
    .filter(talk =>
      !(recordingConfig.notRecordedFormatIds || []).includes(talk.format.id)
      && !(recordingConfig.notRecordedRoomIds || []).includes(talk.room.id)
      && (!recordingConfig.recordedFormatIds || recordingConfig.recordedFormatIds.includes(talk.format.id))
      && (!recordingConfig.recordedRoomIds || recordingConfig.recordedRoomIds.includes(talk.room.id))
      && !talk.isOverflow
    );

  try {
    const allMatchingVideos = await fetchAllVideos(recordingConfig.youtubeHandle, `${start}T00:00:00Z`);

    const simpleTalks: SimpleTalk[] = filteredEventTalks.map(talk => ({
      id: talk.id,
      title: talk.title,
      speakers: talk.speakers.map(sp => ({ fullName: sp.fullName })),
      formatDuration: talk.format.duration
    }));
    const matchingYoutubeTalks = findYoutubeMatchingTalks(simpleTalks, allMatchingVideos);

    await Promise.all(matchingYoutubeTalks.matchedTalks.map(async matchedTalk => {
      const talkSnapshot = await (db.doc(`events/${pathParams.eventId}/talks/${matchedTalk.talk.id}`) as DocumentReference<DetailedTalk>).get()
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

          await talkSnapshot.ref.update({
            assets: assets
          })

          console.log(`Updated talkId=${maybeTalk.id}'s youtube recording url to ${assetUrl} for eventId=${pathParams.eventId}`)
        }
      }
    }))

    return sendResponseMessage(response, 200, matchingYoutubeTalks)
  }catch(e) {
    return sendResponseMessage(response, 500, e?.toString() || "");
  }
}

async function fetchAllVideos(channelHandle: string, minPublishedAt: ISODatetime): Promise<Array<YoutubeVideo>> {
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

  let nextPageToken = await requestPaginatedYoutubeVideos(yt, playlistId, undefined, minPublishedAt, results, unfilteredResults);

  let previousResultsSize = 0;
  while(nextPageToken && previousResultsSize !== results.length) {
    previousResultsSize = results.length;
    nextPageToken = await requestPaginatedYoutubeVideos(yt, playlistId, nextPageToken, minPublishedAt, results, unfilteredResults);
  }

  // fs.writeFileSync(EXPORTED_FILE_NAME, JSON.stringify(results, null, "  "))
  // fs.writeFileSync(EXPORTED_UNFILTERED_FILE_NAME, JSON.stringify(unfilteredResults, null, "  "))

  return results;
}

async function requestPaginatedYoutubeVideos(yt: youtube_v3.Youtube, playlistId: string, nextPageToken: string|undefined, minPublishedAt: ISODatetime, results: YoutubeVideo[], unfilteredResults: YoutubeVideo[]) {
  const minTimestamp = Date.parse(minPublishedAt);
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

  const filteredVids = simpleVids.filter(vid => !vid.publishedAt || Date.parse(vid.publishedAt) > minTimestamp)
  console.log(`Filtered ${simpleVids.length - filteredVids.length} vids based on publish date !`)


  results.push(...filteredVids);

  return videosPage.data.nextPageToken;
}

