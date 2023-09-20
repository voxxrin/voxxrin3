import {
    EventFamily,
    firestoreListableEventToVoxxrinListableEvent, ListableVoxxrinEvent,
} from "@/models/VoxxrinEvent";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {sortBy} from "@/models/utils";
import {computed, unref} from "vue";
import {managedRef as ref} from "@/views/vue-utils";
import {collection, CollectionReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {useCollection} from "vuefire";
import {Logger, PERF_LOGGER} from "@/services/Logger";

type OverridableListableEventProperties = {eventId: string} & Partial<Pick<ListableVoxxrinEvent, "theming"|"location"|"backgroundUrl"|"logoUrl">>;

const overridenListableEventPropertiesRef = ref<OverridableListableEventProperties|undefined>(undefined)

const LOGGER = Logger.named("useAvailableEvents");

export function useAvailableEvents(eventFamilies: EventFamily[]) {

    PERF_LOGGER.debug(() => `useAvailableEvents()`)
    const firestoreListableEventsSource = computed(() =>
        collection(db, 'events') as CollectionReference<ListableEvent>
    );

    const firestoreListableEventsRef = useCollection(firestoreListableEventsSource);

    return {
        listableEvents: computed(() => {
            const firestoreListableEvents = unref(firestoreListableEventsRef),
                overridenListableEventProperties = unref(overridenListableEventPropertiesRef);

            const filteredFirestoreListableEvents = firestoreListableEvents
                .filter(le => eventFamilies.length===0
                    || (le.eventFamily!==undefined && eventFamilies.map(ef => ef.value).includes(le.eventFamily)));

            const availableSortedEvents = sortBy(
                filteredFirestoreListableEvents.map(firestoreListableEventToVoxxrinListableEvent),
                event => -event.start.epochMilliseconds
            );

            return availableSortedEvents.map(event => {
                if(overridenListableEventProperties?.eventId === event.id.value) {
                    const {eventId, ...extractedProps} = overridenListableEventProperties;
                    return {...event, ...extractedProps}
                } else {
                    return event;
                }
            });
        })
    };
}

export function overrideListableEventProperties(overridenListableEventProperties: OverridableListableEventProperties) {
    overridenListableEventPropertiesRef.value = overridenListableEventProperties;
}
