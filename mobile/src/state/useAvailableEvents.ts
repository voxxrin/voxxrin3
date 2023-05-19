import {
    firestoreListableEventToVoxxrinListableEvent, ListableVoxxrinEvent,
} from "@/models/VoxxrinEvent";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {sortBy} from "@/models/utils";
import {computed, unref} from "vue";
import {collection, CollectionReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {useCollection} from "vuefire";


export function useAvailableEvents() {

    const firestoreListableEventsSource = computed(() =>
        collection(db, 'events') as CollectionReference<ListableEvent>
    );

    const firestoreListableEventsRef = useCollection(firestoreListableEventsSource);

    return {
        listableEvents: computed(() => {
            const firestoreListableEvents = unref(firestoreListableEventsRef);

            const availableSortedEvents = sortBy(
                firestoreListableEvents.map(firestoreListableEventToVoxxrinListableEvent),
                event => -event.start.epochMilliseconds
            );

            return availableSortedEvents;
        })
    };
}
