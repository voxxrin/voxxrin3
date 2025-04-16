import {ValueObject} from "@/models/utils";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {Replace} from "@shared/type-utils";

export class RoomId extends ValueObject<string>{ _roomIdClassDiscriminator!: never; }
export type VoxxrinRoom = Replace<ConferenceDescriptor['rooms'][number], {id: RoomId}>
