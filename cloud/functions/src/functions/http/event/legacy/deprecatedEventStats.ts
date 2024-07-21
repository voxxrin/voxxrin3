import * as functions from "firebase-functions";
import {extractSingleQueryParam, sendResponseMessage} from "../../utils";
import {
    checkEventLastUpdate,
    getOrganizerSpaceByToken,
    eventTalkStatsFor
} from "../../../firestore/firestore-utils";
import {match, P} from "ts-pattern";
import {TalkStats} from "../../../../../../../shared/event-stats";
import * as express from "express";

export async function deprecatedEventStats(request: functions.https.Request, response: express.Response) {

    const organizerSecretToken = extractSingleQueryParam(request, 'organizerSecretToken');
    const eventId = extractSingleQueryParam(request, 'eventId');
    const spaceToken = undefined;

    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!organizerSecretToken) { return sendResponseMessage(response, 400, `Missing either [organizerSecretToken] or [familyToken] query parameter !`) }

    const { cachedHash, updatesDetected } = await checkEventLastUpdate(spaceToken, eventId, [
        root => root.favorites,
        root => root.talkListUpdated
    ], request, response)
    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    try {
        const organizerSpace = await match([organizerSecretToken])
            .with([ P.nullish ], async ([_1]) => { throw new Error(`Unexpected state: (undefined,undefined)`); })
            .with([ P.not(P.nullish) ], async ([organizerSecretToken]) => {
                return getOrganizerSpaceByToken(spaceToken, eventId, 'organizerSecretToken', organizerSecretToken);
            }).run()

        const talksStats = await eventTalkStatsFor(spaceToken, eventId);

        const perTalkStats = await Promise.all(organizerSpace.talkFeedbackViewerTokens.map(async (talkFeedbackViewerToken): Promise<TalkStats> => {
            const talkStats: TalkStats = {
                id: talkFeedbackViewerToken.talkId,
                totalFavoritesCount: talksStats.find(ts => ts.id === talkFeedbackViewerToken.talkId)?.totalFavoritesCount || 0
            }
            return talkStats;
        }))

        sendResponseMessage(response, 200, perTalkStats, cachedHash?{
            'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error)
    }
}
