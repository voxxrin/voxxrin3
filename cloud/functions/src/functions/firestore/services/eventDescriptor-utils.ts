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
