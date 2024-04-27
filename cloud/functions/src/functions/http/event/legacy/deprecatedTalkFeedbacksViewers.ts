import * as functions from "firebase-functions";
import * as express from "express";
import {extractSingleQueryParam, sendResponseMessage} from "../../utils";
import {getEventDescriptor} from "../../../firestore/services/eventDescriptor-utils";
import {getFamilyOrganizerToken} from "../../../firestore/services/publicTokens-utils";
import {checkEventLastUpdate, getOrganizerSpaceByToken, getSecretTokenDoc} from "../../../firestore/firestore-utils";
import {match, P} from "ts-pattern";
import {ConferenceOrganizerSpace} from "../../../../../../../shared/conference-organizer-space.firestore";

export async function legacyTalkFeedbacksViewers(request: functions.https.Request, response: express.Response) {

  const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
  const familyOrganizerSecretToken = extractSingleQueryParam(request, 'familyOrganizerSecretToken');
  const eventId = extractSingleQueryParam(request, 'eventId');
  const baseUrl = extractSingleQueryParam(request, 'baseUrl');

  if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
  if(!organizerSecretToken && !familyOrganizerSecretToken) { return sendResponseMessage(response, 400, `Missing either [organizerSecretToken] or [familyOrganizerSecretToken] query parameter !`) }
  if(!baseUrl) { return sendResponseMessage(response, 400, `Missing [baseUrl] query parameter !`) }

  if(familyOrganizerSecretToken) {
    const [eventDescriptor, familyOrganizerToken] = await Promise.all([
      getEventDescriptor(eventId),
      getFamilyOrganizerToken(familyOrganizerSecretToken),
    ]);

    if(!eventDescriptor.eventFamily || !familyOrganizerToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
      return sendResponseMessage(response, 400, `Provided family organizer token doesn't match with event ${eventId} family: [${eventDescriptor.eventFamily}]`)
    }
  }

  const { cachedHash, updatesDetected } = await checkEventLastUpdate(eventId, [root => root.talkListUpdated], request, response)
  if(!updatesDetected) {
    return sendResponseMessage(response, 304)
  }

  try {
    const organizerSpace = await match([organizerSecretToken, familyOrganizerSecretToken])
      .with([ P.nullish, P.nullish ], async ([_1, _2]) => { throw new Error(`Unexpected state: (undefined,undefined)`); })
      .with([ P.not(P.nullish), P.any ], async ([organizerSecretToken, _]) => {
        return getOrganizerSpaceByToken(eventId, 'organizerSecretToken', organizerSecretToken);
      }).with([ P.any, P.not(P.nullish) ], async ([_, familyToken]) => {
        return getSecretTokenDoc<ConferenceOrganizerSpace>(`/events/${eventId}/organizer-space`);
      }).run()

    sendResponseMessage(response, 200, organizerSpace.talkFeedbackViewerTokens.map(tfvt => ({
        ...tfvt,
        registrationUrl: `${baseUrl}${baseUrl.endsWith("/")?"":"/"}user-tokens/register?type=TalkFeedbacksViewer&eventId=${tfvt.eventId}&talkId=${tfvt.talkId}&secretToken=${tfvt.secretToken}`
      })
    ));
  } catch(error) {
    sendResponseMessage(response, 500, ""+error, cachedHash ? {
      'ETag': cachedHash
    }:{});
  }
}
