import {db} from "../../../firebase";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {logPerf} from "../../http/utils";
import {resolvedEventFirestorePath, resolvedEventsFirestorePath} from "@shared/utilities/event-utils";


export async function getEventDescriptor(maybeSpaceToken: string|undefined, eventId: string) {
    return logPerf(`getEventDescriptor(${maybeSpaceToken}, ${eventId})`, async () => {
        const eventDescriptorSnap = await db.doc(`${resolvedEventFirestorePath(eventId, maybeSpaceToken)}/event-descriptor/self`).get();
        const eventDescriptor = eventDescriptorSnap.data() as ConferenceDescriptor;
        return eventDescriptor;
    })
}

export async function getAllEventDescriptorDocs(includingPrivateEvents: boolean = false) {
  if(includingPrivateEvents) {
    throw new Error(`To be implemented: getAllEventDescriptorDocs(includingPrivateEvents=true)`)
  }

  const spaceToken = undefined;

  return logPerf(`getAllEventDescriptorDocs()`, async () => {
    const eventsColl = await db.collection(resolvedEventsFirestorePath(spaceToken)).get();
    return Promise.all(eventsColl.docs.map(async eventDoc => {
      return db.doc(`${resolvedEventFirestorePath(eventDoc.id, spaceToken)}/event-descriptor/self`).get()
    }))
  })
}
