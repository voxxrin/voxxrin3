import {db} from "../../../firebase";
import {TalkStats} from "../../../../../../shared/event-stats";
import {getAllEvents} from "../../firestore/services/event-utils";
import {resolvedEventFirestorePath} from "../../../../../../shared/utilities/event-utils";

export async function globalStats() {
    const users = await db.collection(`users`).listDocuments()
    const userStats = await Promise.all(users.map(async user => {
        const [eventsCount ] = await Promise.all([
            db.collection(`users/${user.id}/events`).count().get().then(snap => snap.data().count),
        ])

        return { userId: user.id, eventsCount };
    }))

    const events = await getAllEvents({includePrivateSpaces: true})
    const eventsStats = await Promise.all(events.map(async event => {
        const [eventTalkStats/* , eventFeedbacksCount */] = await Promise.all([
            db.collection(`${resolvedEventFirestorePath(event.id, event.visibility==='private'?event.spaceToken:undefined)}/talksStats`).listDocuments().then(async (talkStatsSnaps) => {
                const talkStats = await Promise.all(talkStatsSnaps.map(async talkStatsSnap => (await talkStatsSnap.get()).data() as TalkStats))
                return talkStats;
            }),
            // db.collection(`events/${event.id}/organizer-space`).listDocuments().then(async (orgSpaces) => {
            //     const perTalkIdUserFeedbacks = TODO: CHANGE IMPL TO RELY ON FeedbackViewerTokens available from orga space
            //     const feedbacksCount = Object.keys(perTalkIdUserFeedbacks).reduce((feedbacksCount, talkId) => feedbacksCount + Object.keys(perTalkIdUserFeedbacks[talkId]).length, 0);
            //     return feedbacksCount;
            // }),
        ])

        return {eventId: event.id, spaceToken: event.visibility==='private'?event.spaceToken:undefined, eventTalkStats, /* eventFeedbacksCount */ };
    }))

    return {
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
    };
}
