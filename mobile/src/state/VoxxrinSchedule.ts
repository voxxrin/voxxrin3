import {ref, watch} from "vue";
import {Replace, ValueObject} from "@/state/utils";
import {
    Break, DailySchedule,
    Room,
    ScheduleTimeSlot, Speaker, Talk,
    TalkFormat,
    Track
} from "../../../shared/crawler";
import {DeepReadonly} from "ts-essentials";
import {match} from "ts-pattern";


const CURRENT_SCHEDULE = ref<DeepReadonly<VoxxrinDailySchedule>|undefined>(undefined);

export const useCurrentSchedule = () => CURRENT_SCHEDULE.value;

export const watchCurrentSchedule = (
    callback: (currentSchedule: (DeepReadonly<VoxxrinDailySchedule> | undefined)) => void,
    onUnmountedHook: (hook: () => any) => (false | Function | undefined)
) => {
    const cleaner = watch(CURRENT_SCHEDULE, callback);
    onUnmountedHook(cleaner);
}

export const fetchSchedule = async (eventId: EventId, day: Day) => {
    // Avoiding to fetch schedule if the one already loaded matches the one expected
    if(
        !CURRENT_SCHEDULE.value?.eventId.isSameThan(eventId)
        || !CURRENT_SCHEDULE.value?.day.isSameThan(day)
    ) {
        const crawlerDailySchedule: DailySchedule = (await fetch(`/data/dvbe22/${day.value}.json`).then(resp => resp.json()));
        console.log(`timeslots fetched:`, crawlerDailySchedule.timeSlots)

        defineCurrentScheduleFromCrawler(eventId, crawlerDailySchedule);
    }
}


export class EventId extends ValueObject<string>{ _eventIdClassDiscriminator!: never; }
export class Day extends ValueObject<string>{ _dayClassDiscriminator!: never; }
export class RoomId extends ValueObject<string>{ _roomIdClassDiscriminator!: never; }
export class TrackId extends ValueObject<string>{ _trackIdClassDiscriminator!: never; }
export class TalkFormatId extends ValueObject<string>{ _talkFormatIdClassDiscriminator!: never; }
export class SpeakerId extends ValueObject<string>{ _speakerIdClassDiscriminator!: never; }
export class TalkId extends ValueObject<string>{ _talkIdClassDiscriminator!: never; }

export type VoxxrinRoom = Replace<Room, {id: RoomId}>
export type VoxxrinBreak = Replace<Break, {room: VoxxrinRoom}>
export type VoxxrinTrack = Replace<Track, {id: TrackId}>
export type VoxxrinTalkFormat = Replace<TalkFormat, {id: TalkFormatId}>
export type VoxxrinSpeaker = Replace<Speaker, {id: SpeakerId}>;
export type VoxxrinTalk = Replace<Talk, {
    speakers: VoxxrinSpeaker[],
    format: VoxxrinTalkFormat,
    track: VoxxrinTrack,
    room: VoxxrinRoom,
    id: TalkId
}>

export type VoxxrinScheduleTimeSlot = Omit<ScheduleTimeSlot, "type"|"break"|"talks"> & (
  {type: 'break', break: VoxxrinBreak} | {type: 'talks', talks: VoxxrinTalk[]}
);

export type VoxxrinDailySchedule = {
    eventId: EventId;
    day: Day;
    timeSlots: VoxxrinScheduleTimeSlot[]
}


const defineCurrentScheduleFromCrawler = (eventId: EventId, crawlerSchedule: DailySchedule) => {
    const voxxrinSchedule: VoxxrinDailySchedule = {
        eventId: new EventId(eventId.value),
        day: new Day(crawlerSchedule.day),
        timeSlots: crawlerSchedule.timeSlots.map(ts => match(ts)
            .with({type: 'break'}, ts => ({
                start: ts.start,
                end: ts.end,
                id: ts.id,
                type: 'break' as const,
                break: {
                    icon: ts.break.icon,
                    title: ts.break.title,
                    room: { id: new RoomId(ts.break.room.id), title: ts.break.room.title }
                }
            }))
            .with({type: 'talks'}, ts => ({
                start: ts.start,
                end: ts.end,
                id: ts.id,
                type: 'talks' as const,
                talks: ts.talks.map(t => ({
                    language: t.language,
                    title: t.title,
                    speakers: t.speakers.map(sp => ({
                        photoUrl: sp.photoUrl,
                        companyName: sp.companyName,
                        fullName: sp.fullName,
                        id: new SpeakerId(sp.id)
                    })),
                    format: {id: new TalkFormatId(t.format.id), title: t.format.title, duration: t.format.duration},
                    track: {id: new TrackId(t.track.id), title: t.track.title},
                    room: {id: new RoomId(t.room.id), title: t.room.title},
                    id: new TalkId(t.id)
                }))
            }))
            .exhaustive()
        )
    };

    CURRENT_SCHEDULE.value = voxxrinSchedule;
}
