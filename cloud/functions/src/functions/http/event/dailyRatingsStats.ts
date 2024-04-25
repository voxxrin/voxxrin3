import {Response, Request} from "express";
import {logPerf, sendResponseMessage} from "../utils";
import {checkEventLastUpdate, getSecretTokenRef} from "../../firestore/firestore-utils";
import {DailyTalkFeedbackRatings} from "../../../../../../shared/conference-organizer-space.firestore";
import {firestore} from "firebase-admin";
import {match} from "ts-pattern";
import DocumentReference = firestore.DocumentReference;


export async function provideDailyRatingsStats(response: Response, pathParams: {eventId: string}, queryParams: {token: string}, request: Request) {

  const { cachedHash, updatesDetected } = await logPerf("cached hash", async () => {
    return await checkEventLastUpdate(pathParams.eventId, [
      root => root.allFeedbacks,
      root => root.talkListUpdated
    ], request, response)
  });

  if(!updatesDetected) {
    return sendResponseMessage(response, 304)
  }

  const organizerSpaceRef = await getSecretTokenRef(`events/${pathParams.eventId}/organizer-space`);
  const days = await organizerSpaceRef.collection('daily-ratings').listDocuments() as Array<DocumentReference<DailyTalkFeedbackRatings>>;

  const dailyFeedbacks = await Promise.all(days.map(async day => {
    const maybeDailyTalkFeedbacksRatings = (await day.get()).data()
    const totalRatings = match(maybeDailyTalkFeedbacksRatings)
      .with(undefined, () => 0)
      .otherwise((dailyTalkFeedbacksRatings) => {
        const perPublicUserIdFeedbackRatings = Object.values(dailyTalkFeedbacksRatings);
        return perPublicUserIdFeedbackRatings.reduce((total, perPublicUserIdFeedbackRating) => total + Object.values(perPublicUserIdFeedbackRating).length, 0)
      });

    return { dayId: day.id, totalRatings }
  }))

  sendResponseMessage(response, 200, {
    dailyFeedbacks
  }, cachedHash ? {
    'ETag': cachedHash
  }:{});
}
