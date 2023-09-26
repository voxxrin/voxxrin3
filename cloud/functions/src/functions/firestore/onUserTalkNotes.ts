import * as functions from "firebase-functions";
import { db, info } from "../../firebase"

import { FieldValue } from "firebase-admin/firestore";
import {
    TalkStats,
    UserTalkNote
} from "../../../../../shared/feedbacks.firestore";
import {eventLastUpdateRefreshed} from "./firestore-utils";

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

export const onUserTalksNoteUpdate = functions.firestore
    .document("users/{userId}/events/{eventId}/talksNotes/{talkId}")
    .onUpdate(async (change, context) => {
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
            ])
        }
    });

export const onUserTalksNoteCreate = functions.firestore
    .document("users/{userId}/events/{eventId}/talksNotes/{talkId}")
    .onCreate(async (change, context) => {
        const userId = context.params.userId;
        const eventId = context.params.eventId;
        const talkId = context.params.talkId;

        const talkNote = change.data() as UserTalkNote
        const isFavorite = talkNote.note.isFavorite;

        if(isFavorite) {
            info(`favorite create by ${userId} on ${eventId} // ${talkId}: ${isFavorite}`);

            await Promise.all([
                eventLastUpdateRefreshed(eventId, [ "favorites" ]),
                upsertTalkStats(eventId, talkId, isFavorite),
            ])
        }
    });
