import {
    createVoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {collection, doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {EventId} from "@/models/VoxxrinEvent";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";

export async function fetchConferenceDescriptor(eventId: EventId) {
    const conferenceDescriptorSource = doc(collection(doc(collection(db, 'events'), eventId.value), 'event-descriptor'), 'self') as DocumentReference<ConferenceDescriptor>
    const conferenceDescriptor = (await getDoc(conferenceDescriptorSource)).data();
    if(!conferenceDescriptor) {
        return undefined;
    }

    return createVoxxrinConferenceDescriptor(conferenceDescriptor);
}
