import {Replace, ValueObject} from "@/models/utils";
import {Track} from "../../../shared/dayly-schedule.firestore";

export class TrackId extends ValueObject<string>{ _trackIdClassDiscriminator!: never; }
export type VoxxrinTrack = Replace<Track, {id: TrackId}>
