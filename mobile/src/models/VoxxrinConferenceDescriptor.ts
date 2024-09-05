import {ValueObject} from "@/models/utils";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {TalkFormatId, VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";
import {TrackId, VoxxrinTrack} from "@/models/VoxxrinTrack";
import {RoomId, VoxxrinRoom} from "@/models/VoxxrinRoom";
import {EventFamily, EventId, toVoxxrinEventTheme, VoxxrinEventTheme} from "@/models/VoxxrinEvent";
import {Temporal} from "temporal-polyfill";
import {match} from "ts-pattern";
import {useCurrentClock} from "@/state/useCurrentClock";
import {toHMMDuration, toISOLocalDate, zonedDateTimeRangeOf} from "@/models/DatesAndTime";
import {ISOLocalDate, Replace} from "../../../shared/type-utils";

export type VoxxrinConferenceDescriptor = Replace<ConferenceDescriptor, {
    id: EventId;
    eventFamily: EventFamily|undefined,
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime,
    localStartDay: ISOLocalDate,
    localEndDay: ISOLocalDate,
    days: VoxxrinDay[];
    talkFormats: VoxxrinTalkFormat[],
    talkTracks: VoxxrinTrack[],
    supportedTalkLanguages: VoxxrinLanguaceCode[],
    rooms: VoxxrinRoom[],
    theming: VoxxrinEventTheme,
}>;

export type VoxxrinLanguaceCode = Replace<ConferenceDescriptor['supportedTalkLanguages'][number], { id: TalkLanguageCode }>;

export class TalkLanguageCode extends ValueObject<string>{ _talkLanguageCodeDescriptorClassDiscriminator!: never; }

export type ConferenceStatus = 'future'|'ongoing'|'past'
export function conferenceStatusOf(start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime, timezone: string): ConferenceStatus {
    return match([
        start,
        useCurrentClock().zonedDateTimeISO(timezone),
        end
    ]).when(([start, now, _]) =>
            Temporal.ZonedDateTime.compare(now, start) === -1,
        () => 'future' as ConferenceStatus
    ).when(([_, now, end]) =>
            Temporal.ZonedDateTime.compare(end, now) === -1,
        () => 'past' as ConferenceStatus
    ).otherwise(() => 'ongoing' as ConferenceStatus);
}

export function createVoxxrinConferenceDescriptor(firestoreConferenceDescriptor: ConferenceDescriptor) {
    const {start, end} = zonedDateTimeRangeOf(
        firestoreConferenceDescriptor.days.map(d => d.localDate),
        firestoreConferenceDescriptor.timezone
    );

    const [ localStartDay, localEndDay ]: [ISOLocalDate, ISOLocalDate] = [
      firestoreConferenceDescriptor.days.map(d => d.localDate).sort()[0] as ISOLocalDate,
      firestoreConferenceDescriptor.days.map(d => d.localDate).sort().reverse()[0] as ISOLocalDate,
    ]

    const voxxrinConferenceDescriptor: VoxxrinConferenceDescriptor = {
        ...firestoreConferenceDescriptor,
        id: new EventId(firestoreConferenceDescriptor.id),
        eventFamily: firestoreConferenceDescriptor.eventFamily===undefined?undefined:new EventFamily(firestoreConferenceDescriptor.eventFamily),
        start, end,
        localStartDay, localEndDay,
        days: firestoreConferenceDescriptor.days.map(d => ({
            id: new DayId(d.id),
            localDate: d.localDate
        })),
        talkFormats: firestoreConferenceDescriptor.talkFormats.map(tf => ({
            ...tf,
            id: new TalkFormatId(tf.id),
            hmmDuration: toHMMDuration(tf.duration)
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
        theming: toVoxxrinEventTheme(firestoreConferenceDescriptor.theming)
    };

    return voxxrinConferenceDescriptor;
}

export function findVoxxrinDayIndex(conferenceDescriptor: VoxxrinConferenceDescriptor, dayId: DayId) {
    return conferenceDescriptor.days.findIndex(d => d.id.isSameThan(dayId));
}
export function findVoxxrinDay(conferenceDescriptor: VoxxrinConferenceDescriptor, dayId: DayId): VoxxrinDay {
    const dayIndex = findVoxxrinDayIndex(conferenceDescriptor, dayId)
    if(dayIndex === -1) {
        throw new Error(`No day found in conference descriptor ${conferenceDescriptor.id.value} matching day=${dayId.value}`)
    }
    return conferenceDescriptor.days[dayIndex];
}

export function findRoomIndex(confDescriptor: VoxxrinConferenceDescriptor, roomId: RoomId) {
    return confDescriptor.rooms.findIndex(r => r.id.isSameThan(roomId));
}

export function findRoom(confDescriptor: VoxxrinConferenceDescriptor, roomId: RoomId) {
    const roomIndex = findRoomIndex(confDescriptor, roomId);
    if(roomIndex === -1) {
        throw new Error(`No room found in conference descriptor ${confDescriptor.id.value} matching id ${roomId.value}`);
    }
    return confDescriptor.rooms[roomIndex];
}
export function findTalkFormatIndex(confDescriptor: VoxxrinConferenceDescriptor, formatId: TalkFormatId) {
    return confDescriptor.talkFormats.findIndex(f => f.id.isSameThan(formatId));
}
export function findTalkFormat(confDescriptor: VoxxrinConferenceDescriptor, formatId: TalkFormatId) {
    const formatIndex = findTalkFormatIndex(confDescriptor, formatId);
    if(formatIndex === -1) {
        throw new Error(`No format found in conference descriptor ${confDescriptor.id.value} matching id ${formatId.value}`);
    }
    return confDescriptor.talkFormats[formatIndex];
}
export function findTrackIndex(confDescriptor: VoxxrinConferenceDescriptor, trackId: TrackId) {
    return confDescriptor.talkTracks.findIndex(t => t.id.isSameThan(trackId));
}
export function findTrack(confDescriptor: VoxxrinConferenceDescriptor, trackId: TrackId) {
    const trackIndex = findTrackIndex(confDescriptor, trackId);
    if(trackIndex === -1) {
        throw new Error(`No track found in conference descriptor ${confDescriptor.id.value} matching id ${trackId.value}`);
    }
    return confDescriptor.talkTracks[trackIndex];
}

export function areFeedbacksEnabled(confDescriptor: VoxxrinConferenceDescriptor) {
    return confDescriptor.features.ratings.scale.enabled
        || confDescriptor.features.ratings.bingo.enabled
        || confDescriptor.features.ratings["custom-scale"].enabled
        || confDescriptor.features.ratings["free-text"].enabled;
}
