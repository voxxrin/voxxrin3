import { db, info } from "../../firebase"

import { FieldValue, FieldPath } from "firebase-admin/firestore";
import {
    UserTalkNote
} from "../../../../../shared/feedbacks.firestore";
import {eventLastUpdateRefreshed} from "./firestore-utils";
import {TalkStats} from "../../../../../shared/event-stats";
import {Change} from "firebase-functions/lib/common/change";
import {QueryDocumentSnapshot} from "firebase-functions/lib/v1/providers/firestore";
import {EventContext} from "firebase-functions/lib/v1/cloud-functions";

async function upsertTalkStats(eventId: string, talkId: string, isFavorite: boolean) {
    const existingTalksStatsEntryRef = db
        .collection("events").doc(eventId)
        .collection("talksStats").doc(talkId)

    const existingTalksStatsEntry = await existingTalksStatsEntryRef.get()
    if(existingTalksStatsEntry.exists) {
        await existingTalksStatsEntryRef.update({totalFavoritesCount: FieldValue.increment(isFavorite ? 1 : -1)})
    } else {
        const newTalkStatsEntry: TalkStats = {
            id: talkId,
            totalFavoritesCount: isFavorite?1:0
        }
        await existingTalksStatsEntryRef.set(newTalkStatsEntry);
    }
}

async function incrementAllInOneTalkStats(eventId: string, talkId: string, isFavorite: boolean) {
    const allInOneTalkStats = db.doc(`events/${eventId}/talksStats-allInOne/self`)
    await allInOneTalkStats.update(`${talkId}.totalFavoritesCount`, FieldValue.increment(isFavorite ? 1 : -1))
}

async function incrementUserTotalFavs(userId: string, eventId: string, talkId: string, isFavorite: boolean) {
  const userDoc = db.doc(`users/${userId}`)
  await userDoc.update(
    new FieldPath("totalFavs", "total"), FieldValue.increment(isFavorite ? 1:-1),
    new FieldPath("totalFavs", "perEventTotalFavs", eventId), FieldValue.increment(isFavorite ? 1:-1),
  )
}

export const onUserTalksNoteUpdate = async (change: Change<QueryDocumentSnapshot>, context: EventContext<{ userId: string, eventId: string, talkId: string }>) => {
    const userId = context.params.userId;
    const eventId = context.params.eventId;
    const talkId = context.params.talkId;

    const beforeTalkNote = change.before.data() as UserTalkNote
    const afterTalkNote = change.after.data() as UserTalkNote

    const wasFavorite = beforeTalkNote.note.isFavorite;
    const isFavorite = afterTalkNote.note.isFavorite;

    if (wasFavorite != isFavorite) {
        info(`favorite update by ${userId} on ${eventId} // ${talkId}: ${wasFavorite} => ${isFavorite}`);

        await Promise.all([
            eventLastUpdateRefreshed(eventId, [ "favorites" ]),
            upsertTalkStats(eventId, talkId, isFavorite),
            incrementAllInOneTalkStats(eventId, talkId, isFavorite),
            incrementUserTotalFavs(userId, eventId, talkId, isFavorite),
        ])
    }
};

export const onUserTalksNoteCreate = async (change: QueryDocumentSnapshot, context: EventContext<{ userId: string, eventId: string, talkId: string }>) => {
    const userId = context.params.userId;
    const eventId = context.params.eventId;
    const talkId = context.params.talkId;

    const talkNote = change.data() as UserTalkNote
    const isFavorite = !!talkNote.note.isFavorite;

    if(isFavorite) {
        info(`favorite create by ${userId} on ${eventId} // ${talkId}: ${isFavorite}`);

        await Promise.all([
            eventLastUpdateRefreshed(eventId, [ "favorites" ]),
            upsertTalkStats(eventId, talkId, isFavorite),
            incrementAllInOneTalkStats(eventId, talkId, isFavorite),
            incrementUserTotalFavs(userId, eventId, talkId, isFavorite),
        ])
    }
};
