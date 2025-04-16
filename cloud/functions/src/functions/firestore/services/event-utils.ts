import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import {EventLastUpdates, ListableEvent} from "@shared/event-list.firestore";
import QuerySnapshot = firestore.QuerySnapshot;
import DocumentSnapshot = firestore.DocumentSnapshot;
import {getAllSpaceIds} from "./space-utils";
import {resolvedEventFirestorePath, resolvedEventsFirestorePath} from "@shared/utilities/event-utils";
import {AllInOneTalkStats} from "@shared/event-stats";


export async function getAllEventsDocs(opts: { includePrivateSpaces: boolean } = { includePrivateSpaces: false }) {
  const publicEvents = await db.collection('events').get() as QuerySnapshot<ListableEvent>

  const results: Array<QuerySnapshot<ListableEvent>> = [publicEvents];

  if(opts.includePrivateSpaces) {
    const spaceIds = await getAllSpaceIds()
    const privateSpacesEventsResults = await Promise.all(spaceIds.map(async spaceId => {
      return await db.collection(resolvedEventsFirestorePath(spaceId)).get() as QuerySnapshot<ListableEvent>
    }))

    results.push(...privateSpacesEventsResults)
  }

  return results.flatMap(eventResult => eventResult.docs);
}

export async function getAllEvents(opts: { includePrivateSpaces: boolean } = { includePrivateSpaces: false }) {
  const eventsDocs = await getAllEventsDocs(opts);
  return eventsDocs.map(eventDoc => eventDoc.data());
}

export async function getEventLastUpdates(eventId: string, maybeSpaceId: string|undefined) {
  return await db.doc(`${resolvedEventFirestorePath(eventId, maybeSpaceId)}/last-updates/self`).get() as DocumentSnapshot<EventLastUpdates>
}

export async function getAllEventsWithTalksStats(opts: { includePrivateSpaces: boolean } = { includePrivateSpaces: false }) {
  const eventDocs = await getAllEventsDocs(opts);
  return await Promise.all(eventDocs.map(async eventDoc => {
     const allInOneTalkStats = (await eventDoc.ref.collection("talksStats-allInOne").doc("self").get() as DocumentSnapshot<AllInOneTalkStats>).data()
    return { event: eventDoc.data(), allInOneTalkStats: allInOneTalkStats || {} };
  }))
}

export function getMaybeSpaceTokenOf(event: ListableEvent) {
  return event.visibility === 'private' ? event.spaceToken : undefined;
}
