import {ValueObject} from "@/models/utils";
import {Speaker} from "../../../shared/daily-schedule.firestore";
import {Replace} from "../../../shared/type-utils";

export class SpeakerId extends ValueObject<string>{ _speakerIdClassDiscriminator!: never; }
export type VoxxrinDetailedSpeaker = Replace<Speaker, {id: SpeakerId}>;
export type VoxxrinSimpleSpeaker = Omit<VoxxrinDetailedSpeaker, "bio"|"social">;
