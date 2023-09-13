import {db} from "../../../firebase";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";


export async function getEventDescriptor(eventId: string) {
    const eventDescriptorSnap = await db
        .collection("events").doc(eventId)
        .collection("event-descriptor").doc("self")
        .get();

    const eventDescriptor = eventDescriptorSnap.data() as ConferenceDescriptor;
    return eventDescriptor;
}
