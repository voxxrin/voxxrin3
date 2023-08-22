import {
    EventFamily,
    firestoreListableEventToVoxxrinListableEvent, ListableVoxxrinEvent,
} from "@/models/VoxxrinEvent";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {sortBy, ValueObject} from "@/models/utils";
import {computed, ref, unref} from "vue";
import {collection, CollectionReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {useCollection} from "vuefire";

type OverridableListableEventProperties = {eventId: string} & Partial<Pick<ListableVoxxrinEvent, "theming"|"location"|"backgroundUrl"|"logoUrl">>;

const overridenListableEventPropertiesRef = ref<OverridableListableEventProperties|undefined>(undefined)

export function useAvailableEvents(eventFamilies: EventFamily[]) {

    console.debug(`useAvailableEvents()`)
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
