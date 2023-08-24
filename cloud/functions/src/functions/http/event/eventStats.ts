import * as functions from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "../utils";
import {
    ensureOrganizerTokenIsValid,
    eventTalkStatsFor
} from "../../firestore/firestore-utils";
import {TalkStats} from "../../../../../../shared/feedbacks.firestore";

const eventStats = functions.https.onRequest(async (request, response) => {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const eventId = extractSingleQueryParam(request, 'eventId');

    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!organizerSecretToken) { return sendResponseMessage(response, 400, `Missing [organizerSecretToken] query parameter !`) }

    const organizerSpace = await ensureOrganizerTokenIsValid(eventId, organizerSecretToken);
    const talksStats = await eventTalkStatsFor(eventId);

    const perTalkStats = await Promise.all(organizerSpace.talkFeedbackViewerTokens.map(async (talkFeedbackViewerToken): Promise<TalkStats> => {
        const talkStats: TalkStats = {
            id: talkFeedbackViewerToken.talkId,
            totalFavoritesCount: talksStats.find(ts => ts.id === talkFeedbackViewerToken.talkId)?.totalFavoritesCount || 0
        }
        return talkStats;
    }))

    sendResponseMessage(response, 200, JSON.stringify(perTalkStats));
});

export default eventStats
