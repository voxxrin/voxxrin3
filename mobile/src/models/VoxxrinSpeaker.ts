import {ValueObject} from "@/models/utils";
import {Speaker} from "../../../shared/daily-schedule.firestore";
import {Replace} from "../../../shared/type-utils";
import {LineupSpeaker, LineupTalk} from "../../../shared/event-lineup.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {RoomId, VoxxrinRoom} from "@/models/VoxxrinRoom";
import {findRoom, findTalkFormat, findTrack, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
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
    room: VoxxrinRoom,
  }|undefined,
  otherSpeakers: VoxxrinSimpleSpeaker[],
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
          const room = findRoom(conferenceDescriptor, new RoomId(allocation.room.id));
          return {
            ...firestoreTalk.allocation,
            room
          };
        }).otherwise(() => undefined);

      return {
        ...firestoreTalk,
        id: new TalkId(firestoreTalk.id),
        allocation,
        format,
        track,
        otherSpeakers: firestoreTalk.otherSpeakers.map(sp => toVoxxrinSpeaker(sp)),
      };
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
