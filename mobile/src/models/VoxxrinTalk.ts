import {sortBy, ValueObject} from "@/models/utils";
import {Break, DetailedTalk, Talk} from "../../../shared/dayly-schedule.firestore";
import {RoomId, VoxxrinRoom} from "@/models/VoxxrinRoom";
import {SpeakerId, VoxxrinSpeaker} from "@/models/VoxxrinSpeaker";
import {TalkFormatId, VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";
import {TrackId, VoxxrinTrack} from "@/models/VoxxrinTrack";
import {Replace} from "@/models/type-utils";
import {
    findRoom,
    findTalkFormat, findTalkFormatIndex, findTrack,
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {match} from "ts-pattern";
import {VoxxrinDailySchedule, VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";

export class TalkId extends ValueObject<string>{ _talkIdClassDiscriminator!: never; }

export type VoxxrinBreak = Replace<Break, {room: VoxxrinRoom}>
export type VoxxrinTalk = Replace<Talk, {
    speakers: VoxxrinSpeaker[],
    format: VoxxrinTalkFormat,
    track: VoxxrinTrack,
    room: VoxxrinRoom,
    id: TalkId
}>

export type VoxxrinDetailedTalk = Replace<VoxxrinTalk, {
    speakers: Array<VoxxrinSpeaker & {
        speakerBio: string
    }>,
}> & {
    description: string;
    timeslot: VoxxrinScheduleTimeSlot;
}

export function createVoxxrinTalkFromFirestore(event: VoxxrinConferenceDescriptor, firestoreTalk: Talk) {
    const format = findTalkFormat(event, new TalkFormatId(firestoreTalk.format.id));
    const track = findTrack(event, new TrackId(firestoreTalk.track.id));
    const room = findRoom(event, new RoomId(firestoreTalk.room.id));

    return {
        language: firestoreTalk.language,
        title: firestoreTalk.title,
        speakers: firestoreTalk.speakers.map(sp => ({
            photoUrl: sp.photoUrl,
            companyName: sp.companyName,
            fullName: sp.fullName,
            id: new SpeakerId(sp.id)
        })),
        format,
        track,
        room,
        id: new TalkId(firestoreTalk.id)
    }
}
export function createVoxxrinDetailedTalkFromFirestore(event: VoxxrinConferenceDescriptor, dailySchedule: VoxxrinDailySchedule, firestoreTalk: DetailedTalk): VoxxrinDetailedTalk {
    const talk = createVoxxrinTalkFromFirestore(event, firestoreTalk);
    const timeslot = dailySchedule.timeSlots.find(ts => {
        return ts.type === 'talks'
            && ts.talks.findIndex(talkCandidate => talkCandidate.id.isSameThan(talk.id)) !== -1
    })

    if(!timeslot) {
        throw new Error(`No timeslot found in schedule for talk ${talk.id.value} during detailed talk creation from firestore`);
    }

    return {
        ...talk,
        speakers: talk.speakers.map(s => ({
            ...s,
            // TODO: removed this hardcoded value
            speakerBio: `<strong>Here</strong>: the speaker's bio summary (we don't have it yet)`
        })),
        description: firestoreTalk.description,
        timeslot
    };
}


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
