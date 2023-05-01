import {ValueObject} from "@/models/utils";
import {Day} from "../../../shared/conference-descriptor.firestore";
import {Replace} from "@/models/type-utils";

export class DayId extends ValueObject<string>{ _dayIdClassDiscriminator!: never; }
export type VoxxrinDay = Replace<Day, { id: DayId }>
