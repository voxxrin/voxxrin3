import {ValueObject} from "@/models/utils";
import {Replace} from "@/models/type-utils";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {Temporal} from "temporal-polyfill";
import {useCurrentClock} from "@/state/CurrentClock";

export class EventId extends ValueObject<string>{ _eventIdClassDiscriminator!: never; }
export type ListableVoxxrinEvent = Replace<ListableEvent, {
    id: EventId,
    days: Array<VoxxrinDay>,
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime
}>

export function searchEvents(events: ListableVoxxrinEvent[], searchCriteria: { terms: string|undefined, includePastEvents: boolean}, favoritedIds: EventId[]) {
    const filteredEvents = events.filter(event => {
        if(searchCriteria.terms
            && [
                event.title,
                event.location.country,
                event.location.city,
                event.keywords.join(", "),
                event.description,
            ].join(" ").toUpperCase().indexOf(searchCriteria.terms.toUpperCase()) === -1
        ) {
            return false;
        }
        if(!searchCriteria.includePastEvents
            && event.end.add({days:1}).startOfDay().epochMilliseconds < useCurrentClock().zonedDateTimeISO().epochMilliseconds) {
            return false;
        }
        return true;
    });

    const favoritedIdValues = favoritedIds.map(id => id.value);

    return {
        events: filteredEvents,
        favorites: filteredEvents.filter(ev => favoritedIdValues.includes(ev.id.value))
    }
}
