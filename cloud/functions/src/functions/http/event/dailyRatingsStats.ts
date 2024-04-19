import {Response} from "express";
import {logPerf, sendResponseMessage} from "../utils";
import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {getFamilyOrganizerToken} from "../../firestore/services/publicTokens-utils";
import {getSecretTokenRef} from "../../firestore/firestore-utils";
import {DailyTalkFeedbackRatings} from "../../../../../../shared/conference-organizer-space.firestore";
import {firestore} from "firebase-admin";
import {match} from "ts-pattern";
import DocumentReference = firestore.DocumentReference;


export async function provideDailyRatingsStats(response: Response, pathParams: {eventId: string}, queryParams: {token: string}) {

  const [eventDescriptor, familyOrganizerToken] = await logPerf("eventDescriptor and familyRoomStatsContributor retrieval", async () => {
    return await Promise.all([
      getEventDescriptor(pathParams.eventId),
      getFamilyOrganizerToken(queryParams.token),
    ]);
  })

  if (!eventDescriptor.eventFamily || !familyOrganizerToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
    return sendResponseMessage(response, 400, `Provided family organizer token doesn't match with event ${pathParams.eventId} family: [${eventDescriptor.eventFamily}]`)
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
  });
}
