import {ValueObject} from "@/models/utils";
import {Replace} from "@/models/type-utils";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";

export class RoomId extends ValueObject<string>{ _roomIdClassDiscriminator!: never; }
export type VoxxrinRoom = Replace<ConferenceDescriptor['rooms'][number], {id: RoomId}>
