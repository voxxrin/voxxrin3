import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import {EventLastUpdates, ListableEvent} from "../../../../../../shared/event-list.firestore";
import QuerySnapshot = firestore.QuerySnapshot;
import DocumentSnapshot = firestore.DocumentSnapshot;


export async function getAllEvents() {
  const publicEvents = await db.collection('events').get() as QuerySnapshot<ListableEvent>

  return [publicEvents];
}

export async function getEventLastUpdates(eventId: string) {
  return await db.doc(`events/${eventId}/last-updates/self`).get() as DocumentSnapshot<EventLastUpdates>
}
