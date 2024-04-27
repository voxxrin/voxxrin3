import {db} from "../../../firebase";
import {UserTalkNote} from "../../../../../../shared/feedbacks.firestore";
import {User, UserTotalFavs} from "../../../../../../shared/user.firestore";
import { CollectionReference, FieldPath } from "firebase-admin/firestore";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;


export async function forEachUsers(limit: number, startingId: string|undefined, callback: (userDoc: DocumentReference<User>) => Promise<void>){
  let usersColl = db.collection("users").orderBy(FieldPath.documentId());
  if(startingId) {
    usersColl = usersColl.startAt(startingId);
  }

  const userDocs = (
    await usersColl
      .limit(limit)
      .get()
  ).docs;

  await Promise.all(userDocs.map(async userDoc => {
    await callback(userDoc.ref as DocumentReference<User>);
  }))

  return {
    lastUserId: userDocs[userDocs.length-1].id,
    count: userDocs.length
  }
}

async function createUserTotalFavs(userDoc: DocumentReference<User>) {
  const userEvents = await db.collection(`users/${userDoc.id}/events`).listDocuments()
  const perEventTotalFavorites = await Promise.all(userEvents.map(async userEvent => {
    const userEventTalkNotes = await (db.collection(`users/${userDoc.id}/events/${userEvent.id}/talksNotes`) as CollectionReference<UserTalkNote>).listDocuments()
    const talkNotes = await Promise.all(userEventTalkNotes.map(userTalkNoteDoc => userTalkNoteDoc.get()))
    return {
      eventId: userEvent.id,
      totalFavs: talkNotes.reduce((total, talkNote) => total + (talkNote.data()?.note.isFavorite ? 1:0 ), 0)
    }
  }))

  const totalFavs = perEventTotalFavorites.reduce((totalFavs, eventTotalFavs) => {
    totalFavs.total += eventTotalFavs.totalFavs
    totalFavs.perEventTotalFavs[eventTotalFavs.eventId] = eventTotalFavs.totalFavs;
    return totalFavs
  }, { total: 0, perEventTotalFavs: {} } as UserTotalFavs )

  await userDoc.update("totalFavs", totalFavs, "_version", 1)
}
