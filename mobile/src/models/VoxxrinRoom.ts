import {ValueObject} from "@/models/utils";
import {Room} from "../../../shared/dayly-schedule.firestore";
import {Replace} from "@/models/type-utils";

export class RoomId extends ValueObject<string>{ _roomIdClassDiscriminator!: never; }
export type VoxxrinRoom = Replace<Room, {id: RoomId}>
