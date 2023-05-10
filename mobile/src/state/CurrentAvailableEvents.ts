import {Temporal} from "temporal-polyfill";
import {useCurrentClock} from "@/state/CurrentClock";
import {Ref, ref, watch} from "vue";
import {useFetchJsonDebouncer} from "@/state/state-utilities";
import {
    EventId,
    firestoreListableEventToVoxxrinListableEvent,
    ListableVoxxrinEvent,
    toVoxxrinEventTheme
} from "@/models/VoxxrinEvent";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {DayId} from "@/models/VoxxrinDay";
import {zonedDateTimeRangeOf} from "@/models/DatesAndTime";


const CACHED_AVAILABLE_EVENTS_CONSIDERED_OUTDATED_AFTER = Temporal.Duration.from({ hours: 2 })

class FetchedAvailableEvents {
    public readonly lastFetched: Temporal.Instant|undefined = undefined;

    constructor(
        public readonly availableEvents: ListableVoxxrinEvent[]
    ) {
        this.lastFetched = useCurrentClock().zonedDateTimeISO().toInstant()
    }

    isCacheOutdated() {
        if(!this.lastFetched) {
            return true;
        }

        const isOutdated = Temporal.Instant.compare(
            useCurrentClock().zonedDateTimeISO().toInstant(),
            this.lastFetched.add(CACHED_AVAILABLE_EVENTS_CONSIDERED_OUTDATED_AFTER)
        ) === 1;
        return isOutdated;
    }

}

const CURRENT_AVAILABLE_EVENTS: Ref<FetchedAvailableEvents|undefined> = ref();

export const watchCurrentAvailableEvents = (callback: (availableEvents: ListableVoxxrinEvent[]) => void,) => {
    watch(CURRENT_AVAILABLE_EVENTS, (maybeAvailableEvents) => {
        callback(maybeAvailableEvents?.availableEvents || []);
    }, {immediate: true});
}

export async function fetchAvailableEvents() {
    if(CURRENT_AVAILABLE_EVENTS.value && !CURRENT_AVAILABLE_EVENTS.value?.isCacheOutdated()) {
        return Promise.resolve(CURRENT_AVAILABLE_EVENTS.value.availableEvents);
    }

    const firestoreAvailableEvents: ListableEvent[] = await useFetchJsonDebouncer(
        'available-events',
        `events`,
        `/data/events/query.json`
    );

    CURRENT_AVAILABLE_EVENTS.value = new FetchedAvailableEvents(
        firestoreAvailableEvents.map(firestoreListableEventToVoxxrinListableEvent)
    );

    return firestoreAvailableEvents;
}
