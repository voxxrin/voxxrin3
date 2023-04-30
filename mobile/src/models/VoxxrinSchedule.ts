import {DailySchedule, ScheduleTimeSlot} from "../../../shared/dayly-schedule.firestore";
import {TalkId, VoxxrinBreak, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {EventId} from "@/models/VoxxrinEvent";
import {Day} from "@/models/VoxxrinDay";
import {match} from "ts-pattern";
import {RoomId} from "@/models/VoxxrinRoom";
import {SpeakerId} from "@/models/VoxxrinSpeaker";
import {TalkFormatId} from "@/models/VoxxrinTalkFormat";
import {TrackId} from "@/models/VoxxrinTrack";


export type VoxxrinScheduleTimeSlot = Omit<ScheduleTimeSlot, "type"|"break"|"talks"> & (
    {type: 'break', break: VoxxrinBreak} | {type: 'talks', talks: VoxxrinTalk[]}
);

export type VoxxrinDailySchedule = {
    eventId: EventId;
    day: Day;
    timeSlots: VoxxrinScheduleTimeSlot[]
}

export function createVoxxrinDailyScheduleFromFirestore(eventId: EventId, firestoreSchedule: DailySchedule) {
    const voxxrinSchedule: VoxxrinDailySchedule = {
        eventId: new EventId(eventId.value),
        day: new Day(firestoreSchedule.day),
        timeSlots: firestoreSchedule.timeSlots.map(ts => match(ts)
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

    return voxxrinSchedule;
}
