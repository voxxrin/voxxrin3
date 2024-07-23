import {hexToRGB, ValueObject} from "@/models/utils";
import {EventTheme, ListableEvent} from "../../../shared/event-list.firestore";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
import {Temporal} from "temporal-polyfill";
import {useCurrentClock} from "@/state/useCurrentClock";
import {zonedDateTimeRangeOf} from "@/models/DatesAndTime";
import {Replace} from "../../../shared/type-utils";

export class EventId extends ValueObject<string>{ _eventIdClassDiscriminator!: never; }
export class EventFamily extends ValueObject<string>{ _eventFamilyClassDiscriminator!: never; }
export type ListableVoxxrinEventVisibility =
  | { visibility: 'public' }
  | { visibility: 'private', spaceToken: string }
export type ListableVoxxrinEvent = Replace<ListableEvent, {
    id: EventId,
    eventFamily: EventFamily|undefined,
    days: Array<VoxxrinDay>,
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime,
    theming: VoxxrinEventTheme,
} & ListableVoxxrinEventVisibility>

export type VoxxrinEventTheme = Replace<EventTheme, {
    colors: EventTheme['colors'] & {
        primaryRGB: string,
        primaryContrastRGB: string,
        secondaryRGB: string,
        secondaryContrastRGB: string,
        tertiaryRGB: string,
        tertiaryContrastRGB: string
    }
}>

export function searchEvents(events: ListableVoxxrinEvent[], searchCriteria: { terms: string|undefined, includePastEvents: boolean}, pinnededIds: EventId[]) {
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

    const pinnedIdValues = pinnededIds.map(id => id.value);

    return {
        events: filteredEvents,
        pinnedEvents: filteredEvents.filter(ev => pinnedIdValues.includes(ev.id.value))
    }
}

export function firestoreListableEventToVoxxrinListableEvent(firestoreListableEvent: ListableEvent, visibility: ListableVoxxrinEventVisibility): ListableVoxxrinEvent {
    const {start, end} = zonedDateTimeRangeOf(
        firestoreListableEvent.days.map(d => d.localDate),
        firestoreListableEvent.timezone
    );
    return {
        ...firestoreListableEvent,
        id: new EventId(firestoreListableEvent.id),
        eventFamily: firestoreListableEvent.eventFamily===undefined?undefined:new EventFamily(firestoreListableEvent.eventFamily),
        days: firestoreListableEvent.days.map(d => ({...d, id: new DayId(d.id)})),
        start,
        end,
        theming: toVoxxrinEventTheme(firestoreListableEvent.theming),
        ...visibility
    };
}

export function toVoxxrinEventTheme(firestoreTheme: EventTheme): VoxxrinEventTheme {
    return {
        colors: {
            ...firestoreTheme.colors,
            primaryRGB: hexToRGB(firestoreTheme.colors.primaryHex),
            primaryContrastRGB: hexToRGB(firestoreTheme.colors.primaryContrastHex),
            secondaryRGB: hexToRGB(firestoreTheme.colors.secondaryHex),
            secondaryContrastRGB: hexToRGB(firestoreTheme.colors.secondaryContrastHex),
            tertiaryRGB: hexToRGB(firestoreTheme.colors.tertiaryHex),
            tertiaryContrastRGB: hexToRGB(firestoreTheme.colors.tertiaryContrastHex),
        },
    }
}
