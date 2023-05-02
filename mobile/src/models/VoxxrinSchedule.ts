import {DailySchedule, ScheduleTimeSlot} from "../../../shared/dayly-schedule.firestore";
import {TalkId, VoxxrinBreak, VoxxrinTalk} from "@/models/VoxxrinTalk";
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


export type VoxxrinScheduleTimeSlot = Replace<Omit<ScheduleTimeSlot, "break"|"talks">, {
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime
} & (
    {type: 'break', break: VoxxrinBreak} | {type: 'talks', talks: VoxxrinTalk[]}
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
        start,
        end,
        full: `${start} -> ${end}`
    }
}

export function createVoxxrinDailyScheduleFromFirestore(event: VoxxrinConferenceDescriptor, firestoreSchedule: DailySchedule) {
    const voxxrinSchedule: VoxxrinDailySchedule = {
        eventId: new EventId(event.id.value),
        day: new DayId(firestoreSchedule.day),
        timeSlots: firestoreSchedule.timeSlots.map<VoxxrinScheduleTimeSlot>(ts => {
            return {
                start: Temporal.ZonedDateTime.from(`${ts.start}[${event.timezone}]`),
                end: Temporal.ZonedDateTime.from(`${ts.end}[${event.timezone}]`),
                id: ts.id,
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
                        talks: ts.talks.map<VoxxrinTalk>(t => {
                            const format = findTalkFormat(event, new TalkFormatId(t.format.id));
                            const track = findTrack(event, new TrackId(t.track.id));
                            const room = findRoom(event, new RoomId(t.room.id));
                            return {
                                language: t.language,
                                title: t.title,
                                speakers: t.speakers.map(sp => ({
                                    photoUrl: sp.photoUrl,
                                    companyName: sp.companyName,
                                    fullName: sp.fullName,
                                    id: new SpeakerId(sp.id)
                                })),
                                format,
                                track,
                                room,
                                id: new TalkId(t.id)
                            }
                        })
                    }))
                    .exhaustive()
            };
        })
    };

    return voxxrinSchedule;
}
