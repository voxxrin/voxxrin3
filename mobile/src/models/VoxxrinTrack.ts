import {ValueObject} from "@/models/utils";
import {Track} from "../../../shared/dayly-schedule.firestore";
import {Replace} from "@/models/type-utils";

export class TrackId extends ValueObject<string>{ _trackIdClassDiscriminator!: never; }
export type VoxxrinTrack = Replace<Track, {id: TrackId}>
