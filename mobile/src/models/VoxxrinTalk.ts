import {sortBy, ValueObject} from "@/models/utils";
import {Break, DetailedTalk, Talk} from "../../../shared/daily-schedule.firestore";
import {RoomId, VoxxrinRoom} from "@/models/VoxxrinRoom";
import {SpeakerId, VoxxrinDetailedSpeaker, VoxxrinSimpleSpeaker} from "@/models/VoxxrinSpeaker";
import {TalkFormatId, VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";
import {TrackId, VoxxrinTrack} from "@/models/VoxxrinTrack";
import {
    findRoom,
    findTalkFormat, findTalkFormatIndex, findTrack, TalkLanguageCode,
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {match} from "ts-pattern";
import {Replace} from "../../../shared/type-utils";

export class TalkId extends ValueObject<string>{ _talkIdClassDiscriminator!: never; }

export type VoxxrinBreak = Replace<Break, {room: VoxxrinRoom}>
export type VoxxrinTalk = Replace<Talk, {
    speakers: VoxxrinSimpleSpeaker[],
    format: VoxxrinTalkFormat,
    track: VoxxrinTrack,
    room: VoxxrinRoom,
    id: TalkId,
    language: TalkLanguageCode
}>

export type VoxxrinDetailedTalk = Replace<VoxxrinTalk, {
    speakers: Array<VoxxrinDetailedSpeaker>,
}> & Replace<Omit<DetailedTalk, (keyof Talk) | "summary">, {
}>

export function createVoxxrinTalkFromFirestore(event: VoxxrinConferenceDescriptor, firestoreTalk: Talk) {
    const format = findTalkFormat(event, new TalkFormatId(firestoreTalk.format.id));
    const track = findTrack(event, new TrackId(firestoreTalk.track.id));
    const room = findRoom(event, new RoomId(firestoreTalk.room.id));

    const talk: VoxxrinTalk = {
        language: new TalkLanguageCode(firestoreTalk.language),
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
    return talk;
}
export function createVoxxrinDetailedTalkFromFirestore(event: VoxxrinConferenceDescriptor, firestoreTalk: DetailedTalk): VoxxrinDetailedTalk {
    const talk = createVoxxrinTalkFromFirestore(event, firestoreTalk);

    const detailedTalk: VoxxrinDetailedTalk = {
        ...talk,
        start: firestoreTalk.start,
        end: firestoreTalk.end,
        speakers: firestoreTalk.speakers.map(sp => ({
            ...sp,
            id: new SpeakerId(sp.id)
        })),
        description: firestoreTalk.description,
        tags: firestoreTalk.tags || []
    };
    return detailedTalk;
}


export function sortThenGroupByFormat(talks: VoxxrinTalk[], confDescriptor: VoxxrinConferenceDescriptor) {
    const talksPerFormat = sortBy(talks, t => findTalkFormatIndex(confDescriptor, t.format.id))
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

    talksPerFormat.forEach(format => {
        // Ensuring all talks for a given format are always sorted by rooms declaration order
        // in conf descriptor
        format.talks = sortBy(format.talks, talk => confDescriptor.rooms.findIndex(room => room.id.isSameThan(talk.room.id)))
    })

    return talksPerFormat
}

export function filterTalksMatching(talks: VoxxrinTalk[], searchTerms: string|undefined) {
    return talks.filter(talk => {
        if(!searchTerms) {
            return true;
        }

        const talkSearchableContent = `
            ${talk.title}
            ${talk.speakers.map(sp => `${sp.fullName} ${sp.companyName}`).join("\n")}
        `.toLowerCase()

        return searchTerms.split(" ").every(searchTerm => talkSearchableContent.includes(searchTerm.toLowerCase()));
    })
}
