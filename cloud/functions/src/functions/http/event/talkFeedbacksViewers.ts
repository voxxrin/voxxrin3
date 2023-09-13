import * as functions from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "../utils";
import {
    checkEventLastUpdate,
    getOrganizerSpaceByToken, getSecretTokenDoc,
} from "../../firestore/firestore-utils";
import {match, P} from "ts-pattern";
import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {
    getFamilyEventsFeedbacksToken,
} from "../../firestore/services/publicTokens-utils";
import {
    ConferenceOrganizerSpace
} from "../../../../../../shared/conference-organizer-space.firestore";

const talkFeedbacksViewers = functions.https.onRequest(async (request, response) => {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const familyEventsPublicToken = extractSingleQueryParam(request, 'familyEventsPublicToken');
    const eventId = extractSingleQueryParam(request, 'eventId');
    const baseUrl = extractSingleQueryParam(request, 'baseUrl');

    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!organizerSecretToken && !familyEventsPublicToken) { return sendResponseMessage(response, 400, `Missing either [organizerSecretToken] or [familyEventsPublicToken] query parameter !`) }
    if(!baseUrl) { return sendResponseMessage(response, 400, `Missing [baseUrl] query parameter !`) }

    if(familyEventsPublicToken) {
        const [eventDescriptor, familyEventsFeedbacksToken] = await Promise.all([
            getEventDescriptor(eventId),
            getFamilyEventsFeedbacksToken(familyEventsPublicToken),
        ]);

        if(!eventDescriptor.eventFamily || !familyEventsFeedbacksToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
            return sendResponseMessage(response, 400, `Provided family events feedbacks token doesn't match with event ${eventId} family: [${eventDescriptor.eventFamily}]`)
        }
    }

    const { cachedHash, updatesDetected } = await checkEventLastUpdate(eventId, ['talkListUpdated'], request, response)
    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    try {
        const organizerSpace = await match([organizerSecretToken, familyEventsPublicToken])
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
});

export default talkFeedbacksViewers
