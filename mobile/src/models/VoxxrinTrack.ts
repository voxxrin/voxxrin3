import {ValueObject} from "@/models/utils";
import {Replace} from "@/models/type-utils";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";

export class TrackId extends ValueObject<string>{ _trackIdClassDiscriminator!: never; }
export type VoxxrinTrack = Replace<ConferenceDescriptor['talkTracks'][number], {id: TrackId}>
