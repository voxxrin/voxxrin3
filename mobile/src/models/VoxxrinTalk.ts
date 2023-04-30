import {Replace, ValueObject} from "@/models/utils";
import {Break, Talk} from "../../../shared/dayly-schedule.firestore";
import {VoxxrinRoom} from "@/models/VoxxrinRoom";
import {VoxxrinSpeaker} from "@/models/VoxxrinSpeaker";
import {VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";
import {VoxxrinTrack} from "@/models/VoxxrinTrack";

export class TalkId extends ValueObject<string>{ _talkIdClassDiscriminator!: never; }

export type VoxxrinBreak = Replace<Break, {room: VoxxrinRoom}>
export type VoxxrinTalk = Replace<Talk, {
    speakers: VoxxrinSpeaker[],
    format: VoxxrinTalkFormat,
    track: VoxxrinTrack,
    room: VoxxrinRoom,
    id: TalkId
}>
