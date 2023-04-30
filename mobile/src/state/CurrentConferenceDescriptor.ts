import {ref} from "vue";
import {DeepReadonly} from "ts-essentials";
import {
    createVoxxrinConferenceDescriptor,
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {EventId} from "@/models/VoxxrinEvent";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";


const CURRENT_CONFERENCE_DESCRIPTOR = ref<DeepReadonly<VoxxrinConferenceDescriptor>|undefined>(undefined);

export const useCurrentConferenceDescriptor = () => CURRENT_CONFERENCE_DESCRIPTOR.value;
export const fetchConferenceDescriptor = async (eventId: EventId) => {
    // Avoiding to fetch conference descriptor if the one already loaded matches the one expected
    if(
        !CURRENT_CONFERENCE_DESCRIPTOR.value?.id.isSameThan(eventId)
    ) {
        const firestoreConferenceDescriptor: ConferenceDescriptor = await fetch(`/data/${eventId.value}/conference-descriptor/self.json`).then(resp => resp.json());
        console.log(`conference descriptor fetched:`, firestoreConferenceDescriptor)

        defineCurrentConferenceDescriptorFromFirestore(firestoreConferenceDescriptor);
    }

    return CURRENT_CONFERENCE_DESCRIPTOR.value;
}

const defineCurrentConferenceDescriptorFromFirestore = (firestoreConfDesc: ConferenceDescriptor) => {
    const voxxrinConfDescriptor = createVoxxrinConferenceDescriptor(firestoreConfDesc);
    CURRENT_CONFERENCE_DESCRIPTOR.value = voxxrinConfDescriptor;
}
