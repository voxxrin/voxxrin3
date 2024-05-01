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
import {Talk} from "../../../../../../shared/daily-schedule.firestore";
import stringSimilarity from "string-similarity-js";


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
  speakers: Array<{ fullName: string }>,
}
export function findYoutubeMatchingTalks(eventTalks: SimpleTalk[], youtubeVideos: YoutubeVideo[]) {
  const matchedTalks: Array<{ score: number, talk: SimpleTalk, video: YoutubeVideo, titles: string[]}> = []
  const unmatchedTalks: SimpleTalk[] = [];

  for(const talk of eventTalks) {
    const talkLowTitle = `${talk.title.toLowerCase()} - ${talk.speakers.map(sp => sp.fullName.toLowerCase()).join(", ")}`
    const matches = youtubeVideos.map(vid => {
      const lowTitle = vid.title.toLowerCase();
      const titleSimilarityScore = stringSimilarity(talkLowTitle, lowTitle);
      const totalScore = Math.round(titleSimilarityScore*1000)/1000;

      return { totalScore, titles: [talkLowTitle, lowTitle], speakers: talk.speakers.map(sp => sp.fullName), video: vid  }
    })

    matches.sort((m1, m2) => m2.totalScore - m1.totalScore);
    const bestMatch = matches[0]

    if(bestMatch.totalScore > 0.7) {
      matchedTalks.push({ score: bestMatch.totalScore, titles: bestMatch.titles, talk, video: bestMatch.video })
    } else if(bestMatch.totalScore > 0.4) {
      const candidatesWithAtLeastOneSpeakerFound = matches.filter(m =>
        m.totalScore > 0.4
        // not matching 1 speaker out of 2 is ok
        // but wondering if matching "only" 3 speakers out of 6 is ok...
        && includedSpeakersRatio(m.titles[1], m.speakers) >= 0.5
      )
      if(candidatesWithAtLeastOneSpeakerFound.length) {
        matchedTalks.push({ score: candidatesWithAtLeastOneSpeakerFound[0].totalScore, titles: candidatesWithAtLeastOneSpeakerFound[0].titles, talk, video: candidatesWithAtLeastOneSpeakerFound[0].video })
      } else {
        unmatchedTalks.push(talk);
      }
    } else {
      unmatchedTalks.push(talk);
    }
  }

  matchedTalks.sort((m1, m2) => m1.score - m2.score)

  return { matchedTalks, unmatchedTalks, youtubeVideos, talks: eventTalks };
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
      if(speakerSimilarityScore > 0.6) {
        matchedSpeakerFullNames.push(speakerFullName);
        break;
      }
      titleTokensIndex++;
    } while(titleTokensIndex + speakerTokens.length + ADDITIONAL_TOKEN - 1 < titleTokens.length);
  }

  return matchedSpeakerFullNames.length / speakerFullNames.length;
}
