import {extractSingleQueryParam, sendResponseMessage} from "../utils";
import {db} from "../../../firebase";
import {TalkStats} from "../../../../../../shared/event-stats";
import {https} from "firebase-functions";
import {Response} from "express";

export async function globalStats(request: https.Request, response: Response) {
    const migrationToken = extractSingleQueryParam(request, 'migrationToken')
    if (!migrationToken) {
        return sendResponseMessage(response, 400, `Missing 'migrationToken' query parameter !`)
    }
    if (migrationToken !== process.env.MIGRATION_TOKEN) {
        return sendResponseMessage(response, 403, `Forbidden: invalid migrationToken !`)
    }

    const users = await db.collection(`users`).listDocuments()
    const userStats = await Promise.all(users.map(async user => {
        const [eventsCount ] = await Promise.all([
            db.collection(`users/${user.id}/events`).count().get().then(snap => snap.data().count),
        ])

        return { userId: user.id, eventsCount };
    }))

    const events = await db.collection(`events`).listDocuments()
    const eventsStats = await Promise.all(events.map(async event => {
        const [eventTalkStats/* , eventFeedbacksCount */] = await Promise.all([
            db.collection(`events/${event.id}/talksStats`).listDocuments().then(async (talkStatsSnaps) => {
                const talkStats = await Promise.all(talkStatsSnaps.map(async talkStatsSnap => (await talkStatsSnap.get()).data() as TalkStats))
                return talkStats;
            }),
            // db.collection(`events/${event.id}/organizer-space`).listDocuments().then(async (orgSpaces) => {
            //     const perTalkIdUserFeedbacks = TODO: CHANGE IMPL TO RELY ON FeedbackViewerTokens available from orga space
            //     const feedbacksCount = Object.keys(perTalkIdUserFeedbacks).reduce((feedbacksCount, talkId) => feedbacksCount + Object.keys(perTalkIdUserFeedbacks[talkId]).length, 0);
            //     return feedbacksCount;
            // }),
        ])

        return {eventId: event.id, eventTalkStats, /* eventFeedbacksCount */ };
    }))

    sendResponseMessage(response, 200, {
        distinctUsersCount: users.length,
        distinctUsersHavingFavorites: userStats.filter(stats => stats.eventsCount > 0),
        eventsCount: events.length,
        totalFavorites: eventsStats.reduce((totalFavorites, eventStat) =>
            totalFavorites + eventStat.eventTalkStats.reduce((eventFavorites, talkStat) => eventFavorites + talkStat.totalFavoritesCount, 0),
            0
        ),
        // totalFeedbacks: eventsStats.reduce((totalFeedbacks, eventStat) =>
        //     totalFeedbacks + eventStat.eventFeedbacksCount,
        //     0
        // ),
    });
}
