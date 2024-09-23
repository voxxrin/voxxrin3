import {sendResponseMessage} from "../utils";
import {checkEventLastUpdate, getSecretTokenDoc,} from "../../firestore/firestore-utils";
import {ConferenceOrganizerSpace} from "../../../../../../shared/conference-organizer-space.firestore";
import {Request, Response} from "express";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";


export async function eventTalksEditors(
  response: Response,
  pathParams: {eventId: string},
  queryParams: {token: string, baseUrl: string},
  request: Request,
  eventDescriptor: ConferenceDescriptor
) {

    const { cachedHash, updatesDetected } = await checkEventLastUpdate(pathParams.eventId, [
      root => root.talkListUpdated
    ], request, response)
    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    try {
        const organizerSpace = await getSecretTokenDoc<ConferenceOrganizerSpace>(`/events/${pathParams.eventId}/organizer-space`)

        sendResponseMessage(response, 200, organizerSpace.talkFeedbackViewerTokens.map(tfvt => ({
                ...tfvt,
                registrationUrl: `${queryParams.baseUrl}${queryParams.baseUrl.endsWith("/")?"":"/"}user-tokens/register?type=TalkFeedbacksViewer&eventId=${tfvt.eventId}&talkId=${tfvt.talkId}&secretToken=${tfvt.secretToken}`
            })
        ), cachedHash ? {
          'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error);
    }
}
