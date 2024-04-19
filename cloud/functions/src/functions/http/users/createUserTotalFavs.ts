import {db} from "../../../firebase";
import {UserTalkNote} from "../../../../../../shared/feedbacks.firestore";
import {UserTotalFavs} from "../../../../../../shared/user.firestore";
import { CollectionReference, FieldPath } from "firebase-admin/firestore";


export async function createUserTotalFavs(limit: number, startingId?: string|undefined){
  let usersColl = db.collection("users").orderBy(FieldPath.documentId());
  if(startingId) {
    usersColl = usersColl.startAt(startingId);
  }

  const usersWithoutFavsSet = (
    await usersColl
      .limit(limit)
      .get()
  ).docs;

  await Promise.all(usersWithoutFavsSet.map(async userDoc => {
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

    await userDoc.ref.update("totalFavs", totalFavs, "_version", 1)
  }))

  return {
    lastUserId: usersWithoutFavsSet[usersWithoutFavsSet.length-1].id,
    count: usersWithoutFavsSet.length
  }
}
