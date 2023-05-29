import * as functions from "firebase-functions";
import { db, info } from "../../firebase"

import { FieldValue } from "firebase-admin/firestore";
import {
    TalkStats,
    UserComputedEventInfos,
    UserTalkNote
} from "../../../../../shared/feedbacks.firestore";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

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

async function updateUserTalkAllFavorites(userId: string, eventId: string, talkId: string, isFavorite: boolean) {
    const existingUserTalkComputedRef = db
        .collection("users").doc(userId)
        .collection("events").doc(eventId)
        .collection("__computed").doc("self") as DocumentReference<UserComputedEventInfos>;

    const existingUserTalkComputedDoc = await existingUserTalkComputedRef.get()
    if(existingUserTalkComputedDoc.exists) {
        const updatedFavorites = isFavorite
            ?Array.from(new Set((existingUserTalkComputedDoc.data()?.favoritedTalkIds||[]).concat(talkId)))
            :(existingUserTalkComputedDoc.data()?.favoritedTalkIds||[]).filter(favoritedTalkId => favoritedTalkId !== talkId);

        await existingUserTalkComputedRef.update({ favoritedTalkIds: updatedFavorites });
    } else {
        await existingUserTalkComputedRef.set({
            favoritedTalkIds: isFavorite?[talkId]:[]
        });
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
                upsertTalkStats(eventId, talkId, isFavorite),
                updateUserTalkAllFavorites(userId, eventId, talkId, isFavorite),
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
                upsertTalkStats(eventId, talkId, isFavorite),
                updateUserTalkAllFavorites(userId, eventId, talkId, isFavorite),
            ])
        }
    });
