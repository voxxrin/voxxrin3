import * as functions from "firebase-functions";
import * as _ from "lodash";
import { db, info } from "../../firebase"

import { FieldValue } from "firebase-admin/firestore";
import { UserDayTalksNotes } from "../../../../../shared/feedbacks.firestore";

export const onUserTalksNoteUpdate = functions.firestore
    .document("users/{userId}/events/{eventId}/talksNotes/{day}")
    .onUpdate((change, context) => {
        const userId = context.params.userId;
        const eventId = context.params.eventId;
        const day = context.params.day;

        const beforeTalksNotes = change.before.data() as UserDayTalksNotes
        const afterTalksNotes = change.after.data() as UserDayTalksNotes

        const promises = []

        for (const talkNotes of afterTalksNotes.notes) {
            const before = beforeTalksNotes.notes.find((n) => { return n.talkId == talkNotes.talkId})
            const wasFavorite = before?.isFavorite ?? false
            const isFavorite = talkNotes.isFavorite
    
            if (wasFavorite != isFavorite) {
                info(`favorite update by ${userId} on ${eventId} // ${talkNotes.talkId}: ${wasFavorite} => ${isFavorite}`);
    
                promises.push(
                    db
                        .collection("events").doc(eventId)
                        .collection("days").doc(day)
                        .collection("talksStats").doc(talkNotes.talkId)
                        .update({totalFavoritesCount: FieldValue.increment(isFavorite ? 1 : -1)}));
            }
        }

        if (promises.length > 0) {
            return Promise.all(promises)
        } else {
            return false
        }
    });

export const onUserTalksNoteCreate = functions.firestore
    .document("users/{userId}/events/{eventId}/talksNotes/{day}")
    .onCreate((change, context) => {
        const userId = context.params.userId;
        const eventId = context.params.eventId;
        const day = context.params.day;

        const talksNotes = change.data() as UserDayTalksNotes

        const promises = []

        for (const talkNotes of talksNotes.notes) {
            const isFavorite = talkNotes.isFavorite
    
            if (isFavorite) {
                info(`favorite create by ${userId} on ${eventId} // ${talkNotes.talkId}: ${isFavorite}`);
    
                promises.push(
                    db
                        .collection("events").doc(eventId)
                        .collection("days").doc(day)
                        .collection("talksStats").doc(talkNotes.talkId)
                        .update({totalFavoritesCount: FieldValue.increment(1)}));
            }
        }

        if (promises.length > 0) {
            return Promise.all(promises)
        } else {
            return false
        }
    });    