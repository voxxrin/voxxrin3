import {computed, Ref, unref, watch} from "vue";
import {
    createVoxxrinConferenceDescriptor, VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {EventId} from "@/models/VoxxrinEvent";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {
    deferredVuefireUseDocument
} from "@/views/vue-utils";
import {collection, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {createSharedComposable} from "@vueuse/core";
import {PERF_LOGGER} from "@/services/Logger";
import {useOverridenEventDescriptorProperties} from "@/state/useDevUtilities";

function getConferenceDescriptorDoc(eventId: EventId|undefined) {
    if(!eventId || !eventId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(db, 'events'), eventId.value), 'event-descriptor'), 'self') as DocumentReference<ConferenceDescriptor & {__initialId: string}>;;
}
export function useConferenceDescriptor(
    eventIdRef: Ref<EventId | undefined>) {

    const overridenEventDescriptorPropertiesRef = useOverridenEventDescriptorProperties();

    PERF_LOGGER.debug(() => `useConferenceDescriptor(${unref(eventIdRef)?.value})`)
    watch(() => unref(eventIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useConferenceDescriptor[eventIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreConferenceDescriptorRef = deferredVuefireUseDocument([eventIdRef],
        ([eventId]) => getConferenceDescriptorDoc(eventId));

    return {
        conferenceDescriptor: computed(() => {
            const firestoreConferenceDescriptor = unref(firestoreConferenceDescriptorRef),
                overridenEventDescriptorProperties = unref(overridenEventDescriptorPropertiesRef);


            if(!firestoreConferenceDescriptor) {
                return undefined;
            }

            const confDescriptor = createVoxxrinConferenceDescriptor({
                ...firestoreConferenceDescriptor,
                ...overridenEventDescriptorProperties,
                // firestore's document key always overrides document's data().id field (if it exists)
                // In our case for event-descriptor, document key and document.id are going to be different, that's
                // why we want to re-set firestoreConferenceDescriptor.id to initial firestore document's id
                //
                // See https://github.com/vuejs/vuefire/issues/558
                // and https://github.com/vueuse/vueuse/issues/2033#issuecomment-1549922919
                id: firestoreConferenceDescriptor.__initialId
            })
            return confDescriptor;
        })
    };
}

export const useSharedConferenceDescriptor = createSharedComposable(useConferenceDescriptor);
