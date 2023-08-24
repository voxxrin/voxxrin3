import * as functions from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "../utils";
import {
    ensureOrganizerTokenIsValid,
    ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks
} from "../../firestore/firestore-utils";

const attendeesFeedbacks = functions.https.onRequest(async (request, response) => {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const eventId = extractSingleQueryParam(request, 'eventId');
    const sinceTimestamp = Date.parse(extractSingleQueryParam(request, 'updatedSince') || "");

    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!organizerSecretToken) { return sendResponseMessage(response, 400, `Missing [organizerSecretToken] query parameter !`) }
    if(isNaN(sinceTimestamp)) { return sendResponseMessage(response, 400, `Missing valid [updatedSince] query parameter !`) }

    const updatedSince = new Date(sinceTimestamp);
    const organizerSpace = await ensureOrganizerTokenIsValid(eventId, organizerSecretToken);

    const perTalkFeedbacks = await Promise.all(organizerSpace.talkFeedbackViewerTokens.map(async (talkFeedbackViewerToken) => {
        const feedbacks = await ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks(talkFeedbackViewerToken.eventId, talkFeedbackViewerToken.talkId, talkFeedbackViewerToken.secretToken, updatedSince);
        return {
            eventId: talkFeedbackViewerToken.eventId,
            talkId: talkFeedbackViewerToken.talkId,
            feedbacks
        };
    }))

    sendResponseMessage(response, 200, JSON.stringify(perTalkFeedbacks));
});

export default attendeesFeedbacks
