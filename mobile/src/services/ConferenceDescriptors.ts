import {createVoxxrinConferenceDescriptor,} from "@/models/VoxxrinConferenceDescriptor";
import {doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {SpacedEventId} from "@/models/VoxxrinEvent";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {resolvedEventFirestorePath} from "@shared/utilities/event-utils";

export async function fetchConferenceDescriptor(spacedEventId: SpacedEventId) {
    const conferenceDescriptorSource = doc(
      db,
      `${resolvedEventFirestorePath(spacedEventId.eventId.value, spacedEventId.spaceToken?.value)}/event-descriptor/self`
    ) as DocumentReference<ConferenceDescriptor>

    const conferenceDescriptor = (await getDoc(conferenceDescriptorSource)).data();
    if(!conferenceDescriptor) {
        return undefined;
    }

    return createVoxxrinConferenceDescriptor(conferenceDescriptor);
}
