import {computed, ref, unref, watch} from "vue";
import {
    createVoxxrinConferenceDescriptor, VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {EventId} from "@/models/VoxxrinEvent";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {Unreffable} from "@/views/vue-utils";
import {collection, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {useDocument} from "vuefire";
import {createSharedComposable} from "@vueuse/core";
import {
    overrideListableEventProperties
} from "@/state/useAvailableEvents";
import {PERF_LOGGER} from "@/services/Logger";

type OverridableEventDescriptorProperties = {eventId: string} & Partial<Pick<VoxxrinConferenceDescriptor, "headingTitle"|"theming"|"features"|"infos"|"location"|"backgroundUrl"|"logoUrl">>;

const overridenEventDescriptorPropertiesRef = ref<OverridableEventDescriptorProperties|undefined>(undefined)

export function useConferenceDescriptor(
    eventIdRef: Unreffable<EventId | undefined>) {

    PERF_LOGGER.debug(() => `useConferenceDescriptor(${unref(eventIdRef)?.value})`)
    watch(() => unref(eventIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useConferenceDescriptor[eventIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreConferenceDescriptorSource = computed(() => {
        const eventId = unref(eventIdRef);
        if(!eventId || !eventId.value) {
            return undefined;
        }

        return doc(collection(doc(collection(db, 'events'), eventId.value), 'event-descriptor'), 'self') as DocumentReference<ConferenceDescriptor & {__initialId: string}>
    });

    const firestoreConferenceDescriptorRef = useDocument(firestoreConferenceDescriptorSource);

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

export function overrideCurrentEventDescriptorInfos(overridenEventDescriptorProperties: OverridableEventDescriptorProperties) {
    overridenEventDescriptorPropertiesRef.value = overridenEventDescriptorProperties;
    overrideListableEventProperties(overridenEventDescriptorProperties);
}
