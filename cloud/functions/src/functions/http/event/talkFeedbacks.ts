import {sendResponseMessage} from "../utils";
import {
  checkEventLastUpdate,
  ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks,
  getSecretTokenDoc
} from "../../firestore/firestore-utils";
import {ConferenceOrganizerSpace} from "@shared/conference-organizer-space.firestore";
import {Request, Response} from "express";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {ISODatetime} from "@shared/type-utils";
import {resolvedEventFirestorePath, resolvedSpacedEventFieldName} from "@shared/utilities/event-utils";

export async function eventTalkFeedbacks(response: Response, pathParams: {eventId: string, talkId: string, spaceToken?: string|undefined}, queryParams: {token: string, updatedSince?: ISODatetime|undefined }, request: Request, eventDescriptor: ConferenceDescriptor) {

    const { eventId, talkId, spaceToken } = pathParams

    const { cachedHash, updatesDetected } = await checkEventLastUpdate(spaceToken, eventId, [
          root => root.allFeedbacks,
          root => root.talkListUpdated,
          root => root.feedbacks?.[talkId]
      ],
      (lastUpdateDate) => `${resolvedSpacedEventFieldName(eventId, spaceToken)}:${talkId}:${lastUpdateDate}`,
      request, response
    );

    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    try {
        const organizerSpace = await getSecretTokenDoc<ConferenceOrganizerSpace>(`${resolvedEventFirestorePath(eventId, spaceToken)}/organizer-space`)

        const perTalkFeedbacks = await Promise.all(organizerSpace.talkFeedbackViewerTokens
          .filter(talkFeedbacksViewerToken => talkId === talkFeedbacksViewerToken.talkId)
          .map(async (talkFeedbackViewerToken) => {

            const feedbacks = await ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks(spaceToken, talkFeedbackViewerToken.eventId, talkFeedbackViewerToken.talkId, talkFeedbackViewerToken.secretToken);

            // Enriching bingo entries with label
            const enrichedFeedbacks = feedbacks.map(feedback => ({
                ...feedback,
                ratings: {
                    ...feedback.ratings,
                    bingo: feedback.ratings.bingo.map(bingoId => {
                        const bingoEntry = eventDescriptor.features.ratings.bingo.choices.find(choice => choice.id === bingoId);
                        return bingoEntry || {id: bingoId, label: null};
                    })
                }
            }))

            return {
                eventId: talkFeedbackViewerToken.eventId,
                talkId: talkFeedbackViewerToken.talkId,
                feedbacks: enrichedFeedbacks
            };
        }))

        sendResponseMessage(response, 200, perTalkFeedbacks, cachedHash ? {
            'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error);
    }
}
