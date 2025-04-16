import {ValueObject} from "@/models/utils";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {Replace} from "@shared/type-utils";

export class TrackId extends ValueObject<string>{ _trackIdClassDiscriminator!: never; }
export type VoxxrinTrack = Replace<ConferenceDescriptor['talkTracks'][number], {id: TrackId}>
