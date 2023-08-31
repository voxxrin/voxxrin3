import * as functions from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "../utils";
import {
    getOrganizerSpaceByToken,
} from "../../firestore/firestore-utils";

const talkFeedbacksViewers = functions.https.onRequest(async (request, response) => {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const eventId = extractSingleQueryParam(request, 'eventId');
    const baseUrl = extractSingleQueryParam(request, 'baseUrl');

    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!organizerSecretToken) { return sendResponseMessage(response, 400, `Missing [organizerSecretToken] query parameter !`) }
    if(!baseUrl) { return sendResponseMessage(response, 400, `Missing [baseUrl] query parameter !`) }

    try {
        const organizerSpace = await getOrganizerSpaceByToken(eventId, 'organizerSecretToken', organizerSecretToken)

        sendResponseMessage(response, 200, organizerSpace.talkFeedbackViewerTokens.map(tfvt => ({
                ...tfvt,
                registrationUrl: `${baseUrl}${baseUrl.endsWith("/")?"":"/"}user-tokens/register?type=TalkFeedbacksViewer&eventId=${tfvt.eventId}&talkId=${tfvt.talkId}&secretToken=${tfvt.secretToken}`
            })
        ));
    } catch(error) {
        sendResponseMessage(response, 500, ""+error);
    }
});

export default talkFeedbacksViewers
