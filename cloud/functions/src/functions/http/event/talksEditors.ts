import {sendResponseMessage} from "../utils";
import {checkEventLastUpdate, getSecretTokenDoc,} from "../../firestore/firestore-utils";
import {ConferenceOrganizerSpace} from "../../../../../../shared/conference-organizer-space.firestore";
import * as express from "express";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";
import {resolvedEventFirestorePath} from "../../../../../../shared/utilities/event-utils";


export async function eventTalksEditors(
  response: express.Response,
  pathParams: {eventId: string, spaceToken?: string|undefined},
  queryParams: {token: string, baseUrl: string},
  request: express.Request,
  eventDescriptor: ConferenceDescriptor
) {

    const { eventId, spaceToken } = pathParams

    const { cachedHash, updatesDetected } = await checkEventLastUpdate(spaceToken, eventId, [
      root => root.talkListUpdated
    ], request, response)
    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    try {
        const organizerSpace = await getSecretTokenDoc<ConferenceOrganizerSpace>(`${resolvedEventFirestorePath(eventId, spaceToken)}/organizer-space`)

        sendResponseMessage(response, 200, organizerSpace.talkFeedbackViewerTokens.map(tfvt => ({
                ...tfvt,
                registrationUrl: `${queryParams.baseUrl}${queryParams.baseUrl.endsWith("/")?"":"/"}user-tokens/register?type=TalkFeedbacksViewer&spaceToken=${spaceToken || ''}&eventId=${tfvt.eventId}&talkId=${tfvt.talkId}&secretToken=${tfvt.secretToken}`
            })
        ), cachedHash ? {
          'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error);
    }
}
