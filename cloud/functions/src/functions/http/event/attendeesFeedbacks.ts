import * as functions from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "../utils";
import {
    checkEventLastUpdate,
    getOrganizerSpaceByToken,
    ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks
} from "../../firestore/firestore-utils";
import {match, P} from "ts-pattern";

const attendeesFeedbacks = functions.https.onRequest(async (request, response) => {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const familyToken = extractSingleQueryParam(request, 'familyToken');
    const eventId = extractSingleQueryParam(request, 'eventId');
    const sinceTimestamp = Date.parse(extractSingleQueryParam(request, 'updatedSince') || "");

    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!organizerSecretToken && !familyToken) { return sendResponseMessage(response, 400, `Missing either [organizerSecretToken] or [familyToken] query parameter !`) }
    if(isNaN(sinceTimestamp)) { return sendResponseMessage(response, 400, `Missing valid [updatedSince] query parameter !`) }

    const { cachedHash, updatesDetected } = await checkEventLastUpdate(eventId, ['feedbacks'], request, response)
    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    const updatedSince = new Date(sinceTimestamp);

    try {
        const organizerSpace = await match([organizerSecretToken, familyToken])
            .with([ P.nullish, P.nullish ], async ([_1, _2]) => { throw new Error(`Unexpected state: (undefined,undefined)`); })
            .with([ P.not(P.nullish), P.any ], async ([organizerSecretToken, _]) => {
                return getOrganizerSpaceByToken(eventId, 'organizerSecretToken', organizerSecretToken);
            }).with([ P.any, P.not(P.nullish) ], async ([_, familyToken]) => {
                return getOrganizerSpaceByToken(eventId, 'familyToken', familyToken);
            }).run()

        const perTalkFeedbacks = await Promise.all(organizerSpace.talkFeedbackViewerTokens.map(async (talkFeedbackViewerToken) => {
            const feedbacks = await ensureTalkFeedbackViewerTokenIsValidThenGetFeedbacks(talkFeedbackViewerToken.eventId, talkFeedbackViewerToken.talkId, talkFeedbackViewerToken.secretToken, updatedSince);
            return {
                eventId: talkFeedbackViewerToken.eventId,
                talkId: talkFeedbackViewerToken.talkId,
                feedbacks
            };
        }))

        sendResponseMessage(response, 200, perTalkFeedbacks, cachedHash ? {
            'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error);
    }
});

export default attendeesFeedbacks
