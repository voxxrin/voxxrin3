import {Replace, ValueObject} from "@/models/utils";
import {Speaker} from "../../../shared/dayly-schedule.firestore";

export class SpeakerId extends ValueObject<string>{ _speakerIdClassDiscriminator!: never; }
export type VoxxrinSpeaker = Replace<Speaker, {id: SpeakerId}>;
