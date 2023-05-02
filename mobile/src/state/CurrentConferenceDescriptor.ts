import {ref} from "vue";
import {
    createVoxxrinConferenceDescriptor,
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {EventId} from "@/models/VoxxrinEvent";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {useFetchJsonDebouncer} from "@/state/state-utilities";


const CURRENT_CONFERENCE_DESCRIPTOR = ref<VoxxrinConferenceDescriptor|undefined>(undefined);

export const useCurrentConferenceDescriptor = (eventId: EventId) => {
    fetchConferenceDescriptor(eventId);
    return CURRENT_CONFERENCE_DESCRIPTOR;
}
export const fetchConferenceDescriptor = async (eventId: EventId) => {
    // Avoiding to fetch conference descriptor if the one already loaded matches the one expected
    if(
        !CURRENT_CONFERENCE_DESCRIPTOR.value?.id.isSameThan(eventId)
    ) {
        const firestoreConferenceDescriptor: ConferenceDescriptor = await useFetchJsonDebouncer(
            'conference-descriptor',
            eventId.value,
            `/data/${eventId.value}/conference-descriptor/self.json`
        );
        console.debug(`conference descriptor fetched:`, firestoreConferenceDescriptor)

        defineCurrentConferenceDescriptorFromFirestore(firestoreConferenceDescriptor);
    }

    return CURRENT_CONFERENCE_DESCRIPTOR.value;
}

const defineCurrentConferenceDescriptorFromFirestore = (firestoreConfDesc: ConferenceDescriptor) => {
    const voxxrinConfDescriptor = createVoxxrinConferenceDescriptor(firestoreConfDesc);
    CURRENT_CONFERENCE_DESCRIPTOR.value = voxxrinConfDescriptor;
}
