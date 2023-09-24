import {
    EventFamily,
    firestoreListableEventToVoxxrinListableEvent, ListableVoxxrinEvent,
} from "@/models/VoxxrinEvent";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {sortBy, toCollectionReferenceArray} from "@/models/utils";
import {computed, unref} from "vue";
import {collection, CollectionReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {useOverridenListableEventProperties} from "@/state/useDevUtilities";
import {
    deferredVuefireUseCollection
} from "@/views/vue-utils";

const LOGGER = Logger.named("useAvailableEvents");

export function useAvailableEvents(eventFamilies: EventFamily[]) {

    const overridenListableEventPropertiesRef = useOverridenListableEventProperties();

    PERF_LOGGER.debug(() => `useAvailableEvents()`)

    const firestoreListableEventsRef = deferredVuefireUseCollection([],
        () => toCollectionReferenceArray(collection(db, 'events') as CollectionReference<ListableEvent>));

    return {
        listableEvents: computed(() => {
            const firestoreListableEvents = unref(firestoreListableEventsRef),
                overridenListableEventProperties = unref(overridenListableEventPropertiesRef);

            const filteredFirestoreListableEvents = Array.from(firestoreListableEvents.values())
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
