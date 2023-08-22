import * as functions from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "../utils";
import {
    ensureOrganizerTokenIsValid,
    ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks
} from "../../firestore/firestore-utils";

const attendeesFeedbacks = functions.https.onRequest(async (request, response) => {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const eventId = extractSingleQueryParam(request, 'eventId');

    if(!eventId) { return sendResponseMessage(response, 400, `Missing eventId query parameter !`) }
    if(!organizerSecretToken) { return sendResponseMessage(response, 400, `Missing organizerSecretToken query parameter !`) }

    const organizerSpace = await ensureOrganizerTokenIsValid(eventId, organizerSecretToken);

    const perTalkFeedbacks = await Promise.all(organizerSpace.talkFeedbackViewerTokens.map(async (talkFeedbackViewerToken) => {
        const feedbacks = await ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks(talkFeedbackViewerToken.eventId, talkFeedbackViewerToken.talkId, talkFeedbackViewerToken.secretToken);
        return {
            eventId: talkFeedbackViewerToken.eventId,
            talkId: talkFeedbackViewerToken.talkId,
            feedbacks
        };
    }))

    sendResponseMessage(response, 200, JSON.stringify(perTalkFeedbacks));
});

export default attendeesFeedbacks
