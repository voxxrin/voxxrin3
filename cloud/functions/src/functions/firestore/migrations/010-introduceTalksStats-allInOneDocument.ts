import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;
import {TalkStats} from "@shared/event-stats";


export async function introduceTalksStats_allInOneDocument(): Promise<"OK"|"Error"> {
    const events = await db.collection(`events`).listDocuments();

    await Promise.all(events.map(async event => {
        const talkStatsAllInOneDoc = await db.doc(`events/${event.id}/talksStats-allInOne/self`);

        await db.runTransaction(async transaction => {
            const talkStatsDocs = await db.collection(`events/${event.id}/talksStats`).listDocuments() as Array<DocumentReference<TalkStats>>;
            const talksDocs = await db.collection(`events/${event.id}/talks`).listDocuments();
            const talkStats = talkStatsDocs.length ? (await transaction.getAll(...talkStatsDocs)).map(snap => snap.data()) : [];

            const talkStatsPerTalkId = talksDocs.reduce((talkStatsPerTalkId, talk) => {
                const existingTalkStatd = talkStats.find(ts => ts?.id === talk.id);
                talkStatsPerTalkId[talk.id] = existingTalkStatd || { id: talk.id, totalFavoritesCount: 0 };
                return talkStatsPerTalkId;
            }, {} as Record<string, TalkStats>);

            await transaction.set(talkStatsAllInOneDoc, talkStatsPerTalkId);
        })
    }))

    return "OK"
}
