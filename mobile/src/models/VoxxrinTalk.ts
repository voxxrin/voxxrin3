import {sortBy, ValueObject} from "@/models/utils";
import {Break, Room, Talk} from "../../../shared/dayly-schedule.firestore";
import {RoomId, VoxxrinRoom} from "@/models/VoxxrinRoom";
import {VoxxrinSpeaker} from "@/models/VoxxrinSpeaker";
import {VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";
import {VoxxrinTrack} from "@/models/VoxxrinTrack";
import {Replace} from "@/models/type-utils";
import {
    findRoom,
    findRoomIndex, findTalkFormat, findTalkFormatIndex,
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {match} from "ts-pattern";

export class TalkId extends ValueObject<string>{ _talkIdClassDiscriminator!: never; }

export type VoxxrinBreak = Replace<Break, {room: VoxxrinRoom}>
export type VoxxrinTalk = Replace<Talk, {
    speakers: VoxxrinSpeaker[],
    format: VoxxrinTalkFormat,
    track: VoxxrinTrack,
    room: VoxxrinRoom,
    id: TalkId
}>

export function sortThenGroupByFormat(talks: VoxxrinTalk[], confDescriptor: VoxxrinConferenceDescriptor) {
    return sortBy(talks, t => findTalkFormatIndex(confDescriptor, t.format.id))
        .reduce((talksGroupedByFormat, talk) => {
            const talks = match(talksGroupedByFormat.findIndex(formatGroup => formatGroup.format.id.isSameThan(talk.format.id)))
                .with(-1, () => {
                    const talks: VoxxrinTalk[] = [];
                    talksGroupedByFormat.push({format: findTalkFormat(confDescriptor, talk.format.id), talks})
                    return talks;
                }).otherwise(groupFormatIndex => talksGroupedByFormat[groupFormatIndex].talks);

            talks.push(talk);

            return talksGroupedByFormat;
        }, [] as Array<{format: VoxxrinTalkFormat, talks: VoxxrinTalk[]}>)
}
