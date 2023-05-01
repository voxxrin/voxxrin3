import {ValueObject} from "@/models/utils";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {TalkFormatId} from "@/models/VoxxrinTalkFormat";
import {TrackId} from "@/models/VoxxrinTrack";
import {RoomId} from "@/models/VoxxrinRoom";
import {EventId} from "@/models/VoxxrinEvent";
import {DeepReadonly} from "ts-essentials";
import {ArrayReplace, Replace} from "@/models/type-utils";
import {Temporal} from "temporal-polyfill";
import {match} from "ts-pattern";

export type VoxxrinConferenceDescriptor = DeepReadonly<Replace<ConferenceDescriptor, {
    id: EventId;
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime,
    days: ArrayReplace<ConferenceDescriptor, "days", { id: DayId }>;
    talkFormats: ArrayReplace<ConferenceDescriptor, 'talkFormats', { id: TalkFormatId }>,
    talkTracks: ArrayReplace<ConferenceDescriptor, 'talkTracks', { id: TrackId }>,
    supportedTalkLanguages: ArrayReplace<ConferenceDescriptor, 'supportedTalkLanguages', { id: TalkLanguageCode }>,
    rooms: ArrayReplace<ConferenceDescriptor, 'rooms', { id: RoomId }>,
}>>;

export class TalkLanguageCode extends ValueObject<string>{ _talkLanguageCodeDescriptorClassDiscriminator!: never; }

export function findVoxxrinDayById(conferenceDescriptor: VoxxrinConferenceDescriptor, dayId: DayId): VoxxrinDay {
    const day = conferenceDescriptor.days.find(d => d.id.isSameThan(dayId))
    if(!day) {
        throw new Error(`No day found in conference descriptor ${conferenceDescriptor.id.value} matching day=${dayId.value}`)
    }
    return day;
}

export type ConferenceStatus = 'future'|'ongoing'|'past'
export function conferenceStatusOf(confDescriptor: VoxxrinConferenceDescriptor): ConferenceStatus {
    return match([
        confDescriptor.start,
        Temporal.Now.zonedDateTimeISO(confDescriptor.timezone),
        confDescriptor.end
    ]).when(([start, now, _]) =>
            Temporal.ZonedDateTime.compare(now, start) === -1,
        () => 'future' as ConferenceStatus
    ).when(([_, now, end]) =>
            Temporal.ZonedDateTime.compare(end, now) === -1,
        () => 'past' as ConferenceStatus
    ).otherwise(() => 'ongoing' as ConferenceStatus);
}

export function createVoxxrinConferenceDescriptor(firestoreConferenceDescriptor: ConferenceDescriptor) {
    const sortedPlainDates = firestoreConferenceDescriptor.days
        .map(d => Temporal.PlainDate.from(d.localDate))
        .sort(Temporal.PlainDate.compare);

    const [start, end] = [
        sortedPlainDates[0]
            .toZonedDateTime(firestoreConferenceDescriptor.timezone)
            .startOfDay(),
        sortedPlainDates[sortedPlainDates.length-1]
            .toZonedDateTime(firestoreConferenceDescriptor.timezone)
            .startOfDay()
            // "hackish" endOfDay, see https://github.com/tc39/proposal-temporal/issues/2568
            .add({days:1})
            .subtract({nanoseconds:1}),
    ];

    const voxxrinConferenceDescriptor: VoxxrinConferenceDescriptor = {
        ...firestoreConferenceDescriptor,
        id: new EventId(firestoreConferenceDescriptor.id),
        start,
        end,
        days: firestoreConferenceDescriptor.days.map(d => ({
            id: new DayId(d.id),
            localDate: d.localDate
        })),
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
