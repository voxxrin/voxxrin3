import {ValueObject} from "@/models/utils";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {Replace} from "../../../shared/type-utils";

export class DayId extends ValueObject<string>{ _dayIdClassDiscriminator!: never; }
export type VoxxrinDay = Replace<ConferenceDescriptor['days'][number], { id: DayId }>
