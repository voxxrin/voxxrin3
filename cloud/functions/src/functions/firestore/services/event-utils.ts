import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import {EventLastUpdates, ListableEvent} from "../../../../../../shared/event-list.firestore";
import QuerySnapshot = firestore.QuerySnapshot;
import DocumentSnapshot = firestore.DocumentSnapshot;
import {getAllSpaceIds} from "./space-utils";
import {resolvedEventFirestorePath, resolvedEventsFirestorePath} from "../../../../../../shared/utilities/event-utils";
import {AllInOneTalkStats} from "../../../../../../shared/event-stats";
import {detailedTalksToSpeakersLineup} from "../../../models/Event";
import {DetailedTalk} from "../../../../../../shared/daily-schedule.firestore";
import {toValidFirebaseKey} from "../../../../../../shared/utilities/firebase.utils";
import {LineupSpeaker} from "../../../../../../shared/event-lineup.firestore";
import {arrayDiff} from "../../../../../../shared/utilities/arrays.utils";


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

export async function createAllSpeakers(eventTalks: DetailedTalk[], maybeSpaceToken: string|undefined, eventId: string) {
  const lineupSpeakers = detailedTalksToSpeakersLineup(eventTalks);

  const eventRootPath = resolvedEventFirestorePath(eventId, maybeSpaceToken);
  const eventSpeakersColl = db.collection(`${eventRootPath}/speakers`)
  const existingSpeakerDocs = await eventSpeakersColl.listDocuments()

  const speakersDiff = arrayDiff(existingSpeakerDocs, lineupSpeakers, doc => doc.id, sp => sp.id);
  await Promise.all([
    ...speakersDiff.elementsToRemove.map(docToRemove => docToRemove.delete()),
    ...speakersDiff.elementsToAdd.map(lineupSpeakerToAdd => db.doc(`${eventRootPath}/speakers/${toValidFirebaseKey(lineupSpeakerToAdd.id)}`).set(lineupSpeakerToAdd)),
    ...speakersDiff.elementsAlreadyPresent.map(async ({ origin: speakerDoc, target: lineupSpeaker }) => speakerDoc.update(lineupSpeaker)),
  ])

  const allInOneSpeakers = lineupSpeakers.reduce((allInOneSpeakers, lineupSpeaker) => {
    allInOneSpeakers[lineupSpeaker.id] = lineupSpeaker;
    return allInOneSpeakers;
  }, {} as Record<string, LineupSpeaker>)

  await db.doc(`${eventRootPath}/speakers-allInOne/self`).set(allInOneSpeakers);

  return { createdSpeakers: lineupSpeakers }
}
