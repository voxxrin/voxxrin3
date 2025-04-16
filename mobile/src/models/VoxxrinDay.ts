import {ValueObject} from "@/models/utils";
import {Replace} from "@shared/type-utils";
import {Day} from "@shared/event-list.firestore";

export class DayId extends ValueObject<string>{ _dayIdClassDiscriminator!: never; }
export type VoxxrinDay = Replace<Day, { id: DayId }>
