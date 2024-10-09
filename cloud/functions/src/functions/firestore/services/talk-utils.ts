import {db} from "../../../firebase";
import {getSecretTokenRef} from "../firestore-utils";
import {
    DailyTalkFeedbackRatings,
    PerPublicUserIdFeedbackRatings
} from "../../../../../../shared/conference-organizer-space.firestore";
import {logPerf} from "../../http/utils";
import {getTimeslottedTalks} from "./schedule-utils";
import {firestore} from "firebase-admin";
import QuerySnapshot = firestore.QuerySnapshot;
import {Talk, TalkFormat} from "../../../../../../shared/daily-schedule.firestore";
import stringSimilarity from "string-similarity-js";
import {EventRecordingConfig} from "../../../../../../shared/conference-descriptor.firestore";


type PerTalkPublicUserIdFeedbackRating = {
    talkId: string,
    perPublicUserIdRatings: PerPublicUserIdFeedbackRatings,
}

class ConfOrganizerAllRatingsModel {
    constructor(private allRatings: PerTalkPublicUserIdFeedbackRating[]) {}

    ratingsForTalk(talkId: string) {
        const talkFeedbacks = this.allRatings
            .find(rating => rating.talkId === talkId)

        if(!talkFeedbacks) {
            return [];
        }

        return Object.keys(talkFeedbacks.perPublicUserIdRatings).map(publicUserId => ({
            publicUserId,
            ...talkFeedbacks.perPublicUserIdRatings[publicUserId]
        }));
    }

    userRating(talkId: string, publicUserId: string) {
        const talkFeedbacks = this.ratingsForTalk(talkId);
        return talkFeedbacks?.find(ratings => ratings.publicUserId === publicUserId) || undefined
    }
}

export async function getEveryRatingsForEvent(eventId: string, organizerSpaceToken: string) {
    const dailyRatingsColl = await db.collection(`/events/${eventId}/organizer-space/${organizerSpaceToken}/daily-ratings`).listDocuments()

    const allDailyRatings: PerTalkPublicUserIdFeedbackRating[][] = await Promise.all(dailyRatingsColl.map(async dailyRatingsDoc => {
        const dailyPerTalkIdRatings = (await dailyRatingsDoc.get()).data() as DailyTalkFeedbackRatings;
        const talkIds = Object.keys(dailyPerTalkIdRatings)
        return talkIds.map(talkId => {
            return {
                talkId,
                perPublicUserIdRatings: dailyPerTalkIdRatings[talkId]
            }
        })
    }))

    return new ConfOrganizerAllRatingsModel(allDailyRatings.flatMap(dailyRatings => dailyRatings));
}

export async function getTalksDetailsWithRatings(eventId: string) {
    return logPerf(`getTalksDetailsWithRatings(${eventId})`, async () => {
        const organizerSpaceRef = await getSecretTokenRef(`/events/${eventId}/organizer-space`)

        const [ talks, everyRatings ] = await Promise.all([
            getTimeslottedTalks(eventId),
            getEveryRatingsForEvent(eventId, organizerSpaceRef.id)
        ]);

        return talks
          .filter(talk => !talk.isOverflow)
          .map(talk => ({
            talk,
            ratings: everyRatings.ratingsForTalk(talk.id)
          }))
    })
}

export async function getEventTalks(eventId: string) {
  return logPerf(`getEventTalks(${eventId})`, async () => {
    const talkSnapshots = await db.collection(`events/${eventId}/talks`).get() as QuerySnapshot<Talk>

    return talkSnapshots.docs.map(snap => snap.data());
  })
}


export type YoutubeVideo = {
  id: string,
  publishedAt: string|null|undefined,
  title: string,
  duration: string
}

export type SimpleTalk = {
  id: string,
  title: string,
  format: TalkFormat,
  speakers: Array<{ fullName: string }>,
}

export type TalkAndVideoTitles = {
  talkWithSpeakers: string,
  video: string,
}
export type MatchedTalk = {
  score: number,
  talk: SimpleTalk,
  video: YoutubeVideo,
  titles: TalkAndVideoTitles
}
export type UnmatchedTalk = SimpleTalk & {
  highestScoreVideoMatch: VideoMatch|undefined
}

export type VideoMatch = {
  bestScore: number,
  bestScoreFrom: 'titleWithSpeakers'|'titleOnly',
  titleWithSpeakersSimilarityScore: number,
  titleOnlySimilarityScore: number,
  titles: TalkAndVideoTitles,
  titleIncludingSpeakerNamesRatio: number,
  video: YoutubeVideo,
}

const SIMILARITY_MIN_SCORE_FOR_TITLE_WITH_SPEAKERS_MATCH = 0.7,
  SIMILARITY_MIN_SCORE_FOR_TITLE_ONLY_MATCH = 0.8,
  SIMILARITY_MIN_SCORE_FOR_SPEAKERS_ONLY_TITLE_MATCH = 0.4,
  MIN_SPEAKERS_COUNT_MATCHING_RATIO_TO_CONSIDER_A_MATCH = 0.5,
  SIMILARITY_MIN_SCORE_FOR_SPEAKER_NAMES_MATCH = 0.6;
export function findYoutubeMatchingTalks(eventTalks: SimpleTalk[], youtubeVideos: YoutubeVideo[], recordingConfig: EventRecordingConfig) {

  const talkMatchingResults = eventTalks.map(talk => {
    const talkOnlypeakerLowTitle = removeWordsFrom(talk.title.toLowerCase(), recordingConfig.excludeTitleWordsFromMatching)
    const talkAndSpeakerLowTitle = `${talkOnlypeakerLowTitle} - ${talk.speakers.map(sp => sp.fullName.toLowerCase()).join(", ")}`
    const speakerNames = talk.speakers.map(sp => sp.fullName);

    const videoMatches = youtubeVideos.map(vid => {
      const videoLowTitle = removeWordsFrom(vid.title.toLowerCase(), recordingConfig.excludeTitleWordsFromMatching);
      const titleWithSpeakersSimilarityScore = Math.round(stringSimilarity(talkAndSpeakerLowTitle, videoLowTitle) * 1000) / 1000;
      const titleOnlySimilarityScore = Math.round(stringSimilarity(talkOnlypeakerLowTitle, videoLowTitle) * 1000) / 1000;

      const titleIncludingSpeakerNamesRatio = includedSpeakersRatio(vid.title, speakerNames);

      const videoMatch: VideoMatch = {
        ...(titleWithSpeakersSimilarityScore > titleOnlySimilarityScore
          ? {bestScore: titleWithSpeakersSimilarityScore, bestScoreFrom: 'titleWithSpeakers'} as const
          : {bestScore: titleOnlySimilarityScore, bestScoreFrom: 'titleOnly'} as const
        ),
        titleWithSpeakersSimilarityScore,
        titleOnlySimilarityScore,
        titles: { talkWithSpeakers: talkAndSpeakerLowTitle, video: videoLowTitle },
        titleIncludingSpeakerNamesRatio,
        video: vid
      }

      return videoMatch;
    }).sort((m1, m2) => m2.bestScore - m1.bestScore);

    const firstVideoIndexNotMeetingMinMatchCriteria = videoMatches.findIndex(m =>
        m.bestScore < Math.min(
          SIMILARITY_MIN_SCORE_FOR_TITLE_WITH_SPEAKERS_MATCH,
          SIMILARITY_MIN_SCORE_FOR_SPEAKERS_ONLY_TITLE_MATCH,
          SIMILARITY_MIN_SCORE_FOR_TITLE_ONLY_MATCH
        )
      );

    const validVideoMatchCandidates = videoMatches.slice(0, firstVideoIndexNotMeetingMinMatchCriteria);
    const highestScoreInvalidVideo: VideoMatch|undefined = videoMatches[firstVideoIndexNotMeetingMinMatchCriteria];

    return { talk, videoMatches: validVideoMatchCandidates, highestScoreInvalidVideo };
  });

  const unmatchedYoutubeVideos: YoutubeVideo[] = [...youtubeVideos];

  // Processing talks one by one, best scores first
  const { matchedTalks: firstPassMatchedTalks, matchingTalksWithUnmetMatchingThreshold, unmatchedTalks: firstPassUnmatchedTalks } = talkMatchingResults
    // Sorting matching results by best score
    .sort((mr1, mr2) => (mr2.videoMatches[0]?.bestScore || 0) - (mr1.videoMatches[0]?.bestScore || 0))
    .reduce(
    ({ matchedTalks, matchingTalksWithUnmetMatchingThreshold, unmatchedTalks }, talkMatchingResult, _, talkMatchingResults) => {
      if(talkMatchingResult.videoMatches.length) {
        const bestMatchingTalk = talkMatchingResult.videoMatches[0];

        // We should consider this is a matching talk only if talk with speaker score is >= 0.7 or title only is >= 0.8
        if(
          (bestMatchingTalk.bestScoreFrom === 'titleWithSpeakers' && bestMatchingTalk.bestScore >= SIMILARITY_MIN_SCORE_FOR_TITLE_WITH_SPEAKERS_MATCH)
          || (bestMatchingTalk.bestScoreFrom === 'titleOnly' && bestMatchingTalk.bestScore >= SIMILARITY_MIN_SCORE_FOR_TITLE_ONLY_MATCH)
        ) {
          matchedTalks.push({ score: bestMatchingTalk.bestScore, titles: bestMatchingTalk.titles, talk: talkMatchingResult.talk, video: bestMatchingTalk.video })

          // Removing matching results with video on every talkMatchingResults
          unmatchedYoutubeVideos.splice(unmatchedYoutubeVideos.findIndex(vid => vid.id === bestMatchingTalk.video.id), 1);
          talkMatchingResults.forEach(matchingRestult => {
            const videoIndex = matchingRestult.videoMatches.findIndex(videoMatch => videoMatch.video.id === bestMatchingTalk.video.id);
            if(videoIndex !== -1) {
              matchingRestult.videoMatches.splice(videoIndex, 1);
            }
          })
        } else {
          matchingTalksWithUnmetMatchingThreshold.push(talkMatchingResult)
        }
      } else {
        unmatchedTalks.push({ talk: talkMatchingResult.talk, highestScoreInvalidVideo: talkMatchingResult.highestScoreInvalidVideo || null })
      }

      return { matchedTalks, matchingTalksWithUnmetMatchingThreshold, unmatchedTalks };
    }, { matchedTalks: [], matchingTalksWithUnmetMatchingThreshold: [], unmatchedTalks: [] } as {
      matchedTalks: Array<MatchedTalk>,
      matchingTalksWithUnmetMatchingThreshold: Array<{ talk: SimpleTalk, videoMatches: VideoMatch[]}>,
      unmatchedTalks: Array<{ talk: SimpleTalk, highestScoreInvalidVideo: VideoMatch|null }>
    })

  // For every unmatched talk results trying to match with a minimum of speakers + being more laxist on title similarity
  const { matchedTalks, unmatchedTalks } = matchingTalksWithUnmetMatchingThreshold
    // Sorting matching results by titleWithSpeakersSimilarityScore
    .sort((mr1, mr2) => (mr2.videoMatches[0]?.titleWithSpeakersSimilarityScore || 0) - (mr1.videoMatches[0]?.titleWithSpeakersSimilarityScore || 0))
    .reduce(
    ({ matchedTalks, unmatchedTalks }, firstPassUnmatchedTalkResult, _, talkMatchingResults) => {

      const videosMoreLikelyToMatchSpeakers = firstPassUnmatchedTalkResult.videoMatches.filter(mr =>
        mr.titleWithSpeakersSimilarityScore >= SIMILARITY_MIN_SCORE_FOR_SPEAKERS_ONLY_TITLE_MATCH
        // not matching 1 speaker out of 2 is ok
        // but wondering if matching "only" 3 speakers out of 6 is ok...
        && includedSpeakersRatio(mr.titles.video, firstPassUnmatchedTalkResult.talk.speakers.map(sp => sp.fullName)) >= MIN_SPEAKERS_COUNT_MATCHING_RATIO_TO_CONSIDER_A_MATCH
      )

      if(videosMoreLikelyToMatchSpeakers.length) {
        const bestVideoMatch = videosMoreLikelyToMatchSpeakers[0];

        matchedTalks.push({
          score: bestVideoMatch.titleWithSpeakersSimilarityScore,
          titles: bestVideoMatch.titles,
          talk: firstPassUnmatchedTalkResult.talk,
          video: bestVideoMatch.video
        })

        // Removing matching results with video on every talkMatchingResults
        unmatchedYoutubeVideos.splice(unmatchedYoutubeVideos.findIndex(vid => vid.id === bestVideoMatch.video.id), 1);
        talkMatchingResults.forEach(matchingRestult => {
          const videoIndex = matchingRestult.videoMatches.findIndex(videoMatch => videoMatch.video.id === bestVideoMatch.video.id);
          if(videoIndex !== -1) {
            matchingRestult.videoMatches.splice(videoIndex, 1);
          }
        })
      } else {
        unmatchedTalks.push({
          highestScoreInvalidVideo: firstPassUnmatchedTalkResult.videoMatches[0] || null,
          talk: firstPassUnmatchedTalkResult.talk
        })
      }

      return { matchedTalks, unmatchedTalks }
    }, { matchedTalks: firstPassMatchedTalks, unmatchedTalks: firstPassUnmatchedTalks } as {
      matchedTalks: MatchedTalk[],
      unmatchedTalks: typeof firstPassUnmatchedTalks
    })

  matchedTalks.sort((m1, m2) => m1.score - m2.score)

  return { matchedTalks, unmatchedTalks, unmatchedYoutubeVideos, youtubeVideos, talks: eventTalks };
}

function removeWordsFrom(str: string, words: string[]|undefined) {
  return (words||[]).reduce((updatedStr: string, word: string) => {
    return updatedStr.replace(new RegExp(word.toLowerCase().replace("[", "\\["), "gi"), "")
  }, str.toLowerCase())
}

function includedSpeakersRatio(title: string, speakerFullNames: string[]) {
  const ADDITIONAL_TOKEN = 1;
  const matchedSpeakerFullNames: string[] = [];
  for(const speakerFullName of speakerFullNames) {
    const speakerTokens = speakerFullName.toLowerCase().split(" ").filter(value => !!value)
    const titleTokens = title.split(" ");

    let titleTokensIndex = 0;
    do {
      const testingTitleTokens = titleTokens.slice(titleTokensIndex, titleTokensIndex+speakerTokens.length+ADDITIONAL_TOKEN)
      const speakerSimilarityScore = stringSimilarity(testingTitleTokens.join(" "), speakerTokens.join(" "));
      if(speakerSimilarityScore >= SIMILARITY_MIN_SCORE_FOR_SPEAKER_NAMES_MATCH) {
        matchedSpeakerFullNames.push(speakerFullName);
        break;
      }
      titleTokensIndex++;
    } while(titleTokensIndex + speakerTokens.length + ADDITIONAL_TOKEN - 1 < titleTokens.length);
  }

  return matchedSpeakerFullNames.length / speakerFullNames.length;
}
