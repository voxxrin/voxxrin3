import {
    firestoreListableEventToVoxxrinListableEvent, ListableVoxxrinEvent,
} from "@/models/VoxxrinEvent";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {sortBy} from "@/models/utils";
import {computed, Ref, unref} from "vue";
import {collection} from "firebase/firestore";
import {db} from "@/state/firebase";
import {useFirestore} from "@vueuse/firebase";


export function useAvailableEvents() {

    const firestoreListableEvents = useFirestore(collection(db, `events`), [])

    return {
        listableEvents: computed((): ListableVoxxrinEvent[]|undefined => {
            const availableEvents = unref(firestoreListableEvents) as ListableEvent[];

            if(!availableEvents) {
                return undefined;
            }

            const availableSortedEvents = sortBy(
                availableEvents.map(firestoreListableEventToVoxxrinListableEvent),
                event => -event.start.epochMilliseconds
            );

            return availableSortedEvents;
        })
    }
}
