import * as functions from "firebase-functions";
import { db, info } from "../../firebase"

import { FieldValue } from "firebase-admin/firestore";
import {TalkStats, UserTalksNotes} from "../../../../../shared/feedbacks.firestore";

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
    .document("users/{userId}/events/{eventId}/talksNotes/all")
    .onUpdate((change, context) => {
        const userId = context.params.userId;
        const eventId = context.params.eventId;

        const beforeTalksNotes = change.before.data() as UserTalksNotes
        const afterTalksNotes = change.after.data() as UserTalksNotes

        return Promise.all([
            ...afterTalksNotes.notes.map(async afterTalkNote => {
                const maybeBeforeTalkNote = beforeTalksNotes.notes.find((n) => { return n.talkId === afterTalkNote.talkId})
                const wasFavorite = maybeBeforeTalkNote?.isFavorite ?? false
                const isFavorite = afterTalkNote.isFavorite

                if (wasFavorite != isFavorite) {
                    info(`favorite update by ${userId} on ${eventId} // ${afterTalkNote.talkId}: ${wasFavorite} => ${isFavorite}`);

                    await upsertTalkStats(eventId, afterTalkNote.talkId, isFavorite);
                }
            }),
        ])
    });

export const onUserTalksNoteCreate = functions.firestore
    .document("users/{userId}/events/{eventId}/talksNotes/all")
    .onCreate((change, context) => {
        const userId = context.params.userId;
        const eventId = context.params.eventId;

        const talksNotes = change.data() as UserTalksNotes

        return Promise.all([
            ...talksNotes.notes.map(async afterTalkNote => {
                const isFavorite = afterTalkNote.isFavorite

                if (isFavorite) {
                    info(`favorite create by ${userId} on ${eventId} // ${afterTalkNote.talkId}: ${isFavorite}`);

                    await upsertTalkStats(eventId, afterTalkNote.talkId, isFavorite);
                }
            })
        ])
    });
