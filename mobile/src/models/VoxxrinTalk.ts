import {sortBy, ValueObject} from "@/models/utils";
import {Break, DetailedTalk, Talk, TalkAsset} from "../../../shared/daily-schedule.firestore";
import {RoomId, VoxxrinRoom} from "@/models/VoxxrinRoom";
import {SpeakerId, toVoxxrinSpeaker, VoxxrinDetailedSpeaker, VoxxrinSimpleSpeaker} from "@/models/VoxxrinSpeaker";
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
    room: VoxxrinRoom | undefined,
    id: TalkId,
    language: TalkLanguageCode
}>

export type VoxxrinDetailedTalk = Replace<VoxxrinTalk, {
    speakers: Array<VoxxrinDetailedSpeaker>,
}> & Replace<Omit<DetailedTalk, (keyof Talk) | "summary">, {
}>

export function removeTalkOverflowsAndDuplicates(talks: VoxxrinTalk[]) {
  const talksById = talks.reduce((talksById, talk) => {
    if(!talk.isOverflow) {
      talksById.set(talk.id.value, talk);
    }
    return talksById;
  }, new Map<string, VoxxrinTalk>())

  return Array.from(talksById.values());
}

export function createVoxxrinTalkFromFirestore(event: VoxxrinConferenceDescriptor, firestoreTalk: Talk) {
    const format = findTalkFormat(event, new TalkFormatId(firestoreTalk.format.id));
    const track = findTrack(event, new TrackId(firestoreTalk.track.id));
    const maybeRoom = firestoreTalk.room ? findRoom(event, new RoomId(firestoreTalk.room.id)) : undefined;

    const talk: VoxxrinTalk = {
        language: new TalkLanguageCode(firestoreTalk.language),
        title: firestoreTalk.title,
        speakers: firestoreTalk.speakers.map(sp => toVoxxrinSpeaker(sp)),
        format,
        track,
        room: maybeRoom,
        id: new TalkId(firestoreTalk.id),
        isOverflow: firestoreTalk.isOverflow
    }
    return talk;
}
export function createVoxxrinDetailedTalkFromFirestore(event: VoxxrinConferenceDescriptor, firestoreTalk: DetailedTalk): VoxxrinDetailedTalk {
    const talk = createVoxxrinTalkFromFirestore(event, firestoreTalk);

    const detailedTalk: VoxxrinDetailedTalk = {
        ...talk,
        speakers: firestoreTalk.speakers.map(sp => ({
            ...sp,
            id: new SpeakerId(sp.id)
        })),
        description: firestoreTalk.description,
        tags: firestoreTalk.tags || [],
        assets: firestoreTalk.assets,
        allocation: firestoreTalk.allocation,
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
        format.talks = sortBy(
          format.talks,
          talk => {
            const talkRoom = talk.room;
            if(!talkRoom) {
              return 1000; // should be enough to put unallocated talks to room in the end of the list :-)
            }

            return confDescriptor.rooms.findIndex(room => room.id.isSameThan(talkRoom.id))
          }
        )
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
            ${talk.room?.title || ""}
        `.toLowerCase()

        return searchTerms.split(" ").every(searchTerm => talkSearchableContent.includes(searchTerm.toLowerCase()));
    })
}

export function findAssetOfType<T extends TalkAsset['type']>(talk: VoxxrinDetailedTalk, type: T) {
  return talk.assets.find(asset => asset.type === type) as Extract<TalkAsset, { type: T }>|undefined;
}
