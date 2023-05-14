import {ValueObject} from "@/models/utils";
import {Speaker} from "../../../shared/dayly-schedule.firestore";
import {Replace} from "@/models/type-utils";

export class SpeakerId extends ValueObject<string>{ _speakerIdClassDiscriminator!: never; }
export type VoxxrinSpeaker = Replace<Speaker, {id: SpeakerId}>;
