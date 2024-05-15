import {db} from "../../../firebase";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";
import {logPerf} from "../../http/utils";


export async function getEventDescriptor(eventId: string) {
    return logPerf(`getEventDescriptor(${eventId})`, async () => {
        const eventDescriptorSnap = await db.doc(`events/${eventId}/event-descriptor/self`).get();
        const eventDescriptor = eventDescriptorSnap.data() as ConferenceDescriptor;
        return eventDescriptor;
    })
}

export async function getAllEventDescriptorDocs() {
  return logPerf(`getAllEventDescriptorDocs()`, async () => {
    const eventsColl = await db.collection(`events`).get();
    return Promise.all(eventsColl.docs.map(async eventDoc => {
      return db.doc(`events/${eventDoc.id}/event-descriptor/self`).get()
    }))
  })
}
