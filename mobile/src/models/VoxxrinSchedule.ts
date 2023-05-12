import {DailySchedule, ScheduleTimeSlot} from "../../../shared/dayly-schedule.firestore";
import {
    createVoxxrinTalkFromFirestore,
    TalkId,
    VoxxrinBreak,
    VoxxrinTalk
} from "@/models/VoxxrinTalk";
import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {match} from "ts-pattern";
import {RoomId} from "@/models/VoxxrinRoom";
import {SpeakerId} from "@/models/VoxxrinSpeaker";
import {TalkFormatId} from "@/models/VoxxrinTalkFormat";
import {TrackId} from "@/models/VoxxrinTrack";
import {Temporal} from "temporal-polyfill";
import {Replace} from "@/models/type-utils";
import {
    findRoom,
    findTalkFormat,
    findTrack,
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {formatHourMinutes} from "@/models/DatesAndTime";
import {NumberRange, sortBy, ValueObject} from "@/models/utils";

export class ScheduleTimeSlotId extends ValueObject<string>{ _scheduleTimeSlotIdClassDiscriminator!: never; }

export type VoxxrinScheduleTimeSlot = Replace<Omit<ScheduleTimeSlot, "break"|"talks">, {
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime,
    id: ScheduleTimeSlotId
} & (
    {type: 'break', break: VoxxrinBreak}
    | {
        type: 'talks', talks: VoxxrinTalk[],
        overlappingTimeSlots: ScheduleTimeSlotId[]
    }
)>;

export type VoxxrinDailySchedule = {
    eventId: EventId;
    day: DayId;
    timeSlots: VoxxrinScheduleTimeSlot[]
}

export type TimeslotTimingProgress =
    {status: 'past' }
  | {status: 'future'}
  | {status: 'ongoing', progressInPercent: number};

export function getTimeslotTimingProgress(timeslot: VoxxrinScheduleTimeSlot, now: Temporal.ZonedDateTime): TimeslotTimingProgress {
    return match([timeslot.start, now, timeslot.end])
        .when(
            ([start, now, _]) => Temporal.ZonedDateTime.compare(now, start) === -1,
                () => ({ status: 'future' } as TimeslotTimingProgress)
        ).when(
            ([_, now, end]) => Temporal.ZonedDateTime.compare(end, now) === -1,
            () => ({ status: 'past' } as TimeslotTimingProgress)
        ).otherwise(([start, now, end]) => {
            return {
                status: 'ongoing',
                progressInPercent: Math.round(
                    (now.toInstant().epochMilliseconds - start.toInstant().epochMilliseconds)*100
                    / (end.toInstant().epochMilliseconds - start.toInstant().epochMilliseconds)
                )
            };
        })
}

export function getTimeslotLabel(timeslot: VoxxrinScheduleTimeSlot) {
    const start = formatHourMinutes(timeslot.start)
    const end = formatHourMinutes(timeslot.end)
    return {
        id: timeslot.id,
        start,
        end,
        full: `${start} -> ${end}`
    }
}

export function createVoxxrinDailyScheduleFromFirestore(event: VoxxrinConferenceDescriptor, firestoreSchedule: DailySchedule) {
    const timeSlots: VoxxrinScheduleTimeSlot[] = sortBy(firestoreSchedule.timeSlots.map(ts => {
        return {
            start: Temporal.ZonedDateTime.from(`${ts.start}[${event.timezone}]`),
            end: Temporal.ZonedDateTime.from(`${ts.end}[${event.timezone}]`),
            id: new ScheduleTimeSlotId(ts.id),
            ...match(ts)
                .with({type: 'break'}, ts => ({
                    type: 'break' as const,
                    break: {
                        icon: ts.break.icon,
                        title: ts.break.title,
                        room: { id: new RoomId(ts.break.room.id), title: ts.break.room.title }
                    }
                }))
                .with({type: 'talks'}, ts => ({
                    type: 'talks' as const,
                    talks: ts.talks.map<VoxxrinTalk>(t => createVoxxrinTalkFromFirestore(event, t)),
                    overlappingTimeSlots: firestoreSchedule.timeSlots
                        .filter(overlappingTSCandidate => {
                            return overlappingTSCandidate.id !== ts.id
                                && overlappingTSCandidate.type === 'talks'
                                && NumberRange.overlap({
                                    start: new Date(overlappingTSCandidate.start).getTime(),
                                    end: new Date(overlappingTSCandidate.end).getTime(),
                                }, {
                                    start: new Date(ts.start).getTime(),
                                    end: new Date(ts.end).getTime(),
                                }, 'exclusive');
                        }).map(ts => new ScheduleTimeSlotId(ts.id))
                }))
                .exhaustive()
        };
    }), (timeslot) => {
        const duration = timeslot.end.toInstant().epochSeconds - timeslot.start.toInstant().epochSeconds;
        // This one is weird ... we want to sort by start ASC and by duration DESC
        // I mean, 12345 duration will become 987654 here
        // (with 6 digits we're safe ... it represents a timeslot duration of 277h...)
        const complementedDuration = 999999 - duration;
        return `${timeslot.start} || ${complementedDuration}`;
    })

    const voxxrinSchedule: VoxxrinDailySchedule = {
        eventId: new EventId(event.id.value),
        day: new DayId(firestoreSchedule.day),
        timeSlots
    };

    return voxxrinSchedule;
}
