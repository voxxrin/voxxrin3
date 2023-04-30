import {ArrayReplace, Replace, ValueObject} from "@/models/utils";
import {Day} from "@/models/VoxxrinDay";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {TalkFormatId} from "@/models/VoxxrinTalkFormat";
import {TrackId} from "@/models/VoxxrinTrack";
import {RoomId} from "@/models/VoxxrinRoom";



export type VoxxrinConferenceDescriptor = Replace<ConferenceDescriptor, {
    id: ConferenceDescriptorId;
    days: Day[];
    talkFormats: ArrayReplace<ConferenceDescriptor, 'talkFormats', { id: TalkFormatId }>,
    talkTracks: ArrayReplace<ConferenceDescriptor, 'talkTracks', { id: TrackId }>,
    supportedTalkLanguages: ArrayReplace<ConferenceDescriptor, 'supportedTalkLanguages', { id: TalkLanguageCode }>,
    rooms: ArrayReplace<ConferenceDescriptor, 'rooms', { id: RoomId }>,
}>;

export class ConferenceDescriptorId extends ValueObject<string>{ _conferenceDescriptorClassDiscriminator!: never; }
export class TalkLanguageCode extends ValueObject<string>{ _talkLanguageCodeDescriptorClassDiscriminator!: never; }

export function createVoxxrinConferenceDescriptor(firestoreConferenceDescriptor: ConferenceDescriptor) {
    const voxxrinConferenceDescriptor: VoxxrinConferenceDescriptor = {
        ...firestoreConferenceDescriptor,
        id: new ConferenceDescriptorId(firestoreConferenceDescriptor.id),
        days: firestoreConferenceDescriptor.days.map(d => new Day(d)),
        talkFormats: firestoreConferenceDescriptor.talkFormats.map(tf => ({
            ...tf,
            id: new TalkFormatId(tf.id)
        })),
        talkTracks: firestoreConferenceDescriptor.talkTracks.map(tt => ({
            ...tt,
            id: new TrackId(tt.id)
        })),
        supportedTalkLanguages: firestoreConferenceDescriptor.supportedTalkLanguages.map(tl => ({
            ...tl,
            id: new TalkLanguageCode(tl.id)
        })),
        rooms: firestoreConferenceDescriptor.rooms.map(r => ({
            ...r,
            id: new RoomId(r.id)
        })),
    };

    return voxxrinConferenceDescriptor;
}
