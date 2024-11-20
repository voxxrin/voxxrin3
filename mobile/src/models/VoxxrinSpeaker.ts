import {ValueObject} from "@/models/utils";
import {Speaker} from "../../../shared/daily-schedule.firestore";
import {ISODatetime, Replace} from "../../../shared/type-utils";
import {LineupSpeaker, LineupTalk} from "../../../shared/event-lineup.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {RoomId, VoxxrinRoom} from "@/models/VoxxrinRoom";
import {
  findRoom,
  findTalkFormat,
  findTrack,
  TalkLanguageCode,
  VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {match, P} from "ts-pattern";
import {TalkFormatId, VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";
import {TrackId, VoxxrinTrack} from "@/models/VoxxrinTrack";

export class SpeakerId extends ValueObject<string>{ _speakerIdClassDiscriminator!: never; }
export type VoxxrinDetailedSpeaker = Replace<Speaker, {id: SpeakerId}>;
export type VoxxrinSimpleSpeaker = Omit<VoxxrinDetailedSpeaker, "bio"|"social">;

export type VoxxrinLineupTalk = Replace<LineupTalk, {
  id: TalkId,
  format: VoxxrinTalkFormat,
  track: VoxxrinTrack,
  allocation: {
    start: ISODatetime,
    end: ISODatetime,
    room: VoxxrinRoom|undefined,
  }|undefined,
  otherSpeakers: VoxxrinSimpleSpeaker[],
  language: TalkLanguageCode,
}>

export type VoxxrinLineupSpeaker = Replace<LineupSpeaker, {
  id: SpeakerId,
  talks: VoxxrinLineupTalk[],
}>

export const toVoxxrinSpeaker = (speaker: Speaker): VoxxrinSimpleSpeaker => {
  return ({
    photoUrl: speaker.photoUrl,
    companyName: speaker.companyName,
    fullName: speaker.fullName,
    id: new SpeakerId(speaker.id)
  })
}

export const createVoxxrinSpeakerFromFirestore = (conferenceDescriptor: VoxxrinConferenceDescriptor, firestoreSpeaker: LineupSpeaker): VoxxrinLineupSpeaker => {
  return {
    ...firestoreSpeaker,
    id: new SpeakerId(firestoreSpeaker.id),
    talks: firestoreSpeaker.talks.map(firestoreTalk => {
      const format = findTalkFormat(conferenceDescriptor, new TalkFormatId(firestoreTalk.format.id));
      const track = findTrack(conferenceDescriptor, new TrackId(firestoreTalk.track.id));
      const allocation = match(firestoreTalk.allocation)
        .with(P.not(P.nullish), allocation => {
          const maybeRoom = allocation.room ? findRoom(conferenceDescriptor, new RoomId(allocation.room.id)) : undefined;
          return {
            ...allocation,
            room: maybeRoom
          };
        }).otherwise(() => undefined);

      const lineupTalk: VoxxrinLineupTalk = {
        ...firestoreTalk,
        id: new TalkId(firestoreTalk.id),
        allocation,
        format,
        track,
        otherSpeakers: firestoreTalk.otherSpeakers.map(sp => toVoxxrinSpeaker(sp)),
        language: new TalkLanguageCode(firestoreTalk.language),
      };
      return lineupTalk;
    })
  }
}

export const speakerMatchesSearchTerms = (speaker: VoxxrinLineupSpeaker, searchTerms: string|undefined): boolean => {
  if(!searchTerms) {
    return true;
  }

  const speakerSearchableContent = `
            ${speaker.fullName}
            ${speaker.companyName || ''}
            ${speaker.bio}
            ${speaker.talks.map(talk => `${talk.title} ${talk.format.title} ${talk.track.title}`).join("\n")}
        `.toLowerCase()

  return searchTerms.split(" ").every(searchTerm => speakerSearchableContent.includes(searchTerm.toLowerCase()));
}
