import {Replace, ValueObject} from "@/models/utils";
import {Room} from "../../../shared/dayly-schedule.firestore";

export class RoomId extends ValueObject<string>{ _roomIdClassDiscriminator!: never; }
export type VoxxrinRoom = Replace<Room, {id: RoomId}>
