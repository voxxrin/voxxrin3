import {ValueObject} from "@/models/utils";
import {Replace} from "@/models/type-utils";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {Temporal} from "temporal-polyfill";

export class EventId extends ValueObject<string>{ _eventIdClassDiscriminator!: never; }
export type ListableVoxxrinEvent = Replace<ListableEvent, {
    id: EventId,
    days: Array<VoxxrinDay>,
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime
}>
