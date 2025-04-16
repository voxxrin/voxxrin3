import {
  BreakTimeSlot,
  DailySchedule,
  TalksTimeSlot,
  TimeSlotBase
} from "@shared/daily-schedule.firestore";
import {
    createVoxxrinTalkFromFirestore, filterTalksMatching, TalkId,
    VoxxrinBreak,
    VoxxrinTalk
} from "@/models/VoxxrinTalk";
import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {match} from "ts-pattern";
import {RoomId} from "@/models/VoxxrinRoom";
import {Temporal} from "temporal-polyfill";
import {
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {formatHourMinutes, localDateToReadableParts} from "@/models/DatesAndTime";
import {NumberRange, sortBy, ValueObject} from "@/models/utils";
import {useCurrentUserLocale} from "@/state/useCurrentUser";
import {LabelledTimeslotWithFeedback} from "@/state/useSchedule";
import {findTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {UserDailyFeedbacks} from "@shared/feedbacks.firestore";
import {Replace} from "@shared/type-utils";

export class ScheduleTimeSlotId extends ValueObject<string>{ _scheduleTimeSlotIdClassDiscriminator!: never; }

type VoxxrinTimeSlotBase = Replace<TimeSlotBase, {
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime,
    id: ScheduleTimeSlotId
}>;

export type VoxxrinScheduleBreakTimeSlot = Replace<BreakTimeSlot, VoxxrinTimeSlotBase & {
    type: 'break',
    break: VoxxrinBreak
}>

export type VoxxrinScheduleTalksTimeSlot = Replace<TalksTimeSlot, VoxxrinTimeSlotBase & {
    type: 'talks',
    talks: VoxxrinTalk[],
    overlappingTimeSlots: ScheduleTimeSlotId[]
}>

export type VoxxrinScheduleTimeSlot = VoxxrinScheduleBreakTimeSlot | VoxxrinScheduleTalksTimeSlot;

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

export function getRoomsTalksSchedule(timeslots: VoxxrinScheduleTimeSlot[]) {
  const perRoomIdTalks = new Map<string, Array<{ talk: VoxxrinTalk, timeslot: VoxxrinScheduleTalksTimeSlot }>>()

  // Important note: we consider timeslots are sorted (in chronological order)
  // and thus are considering that talks per room will (implicitely) use this same chronological ordering
  for(const timeslot of timeslots) {
    if(timeslot.type === 'talks') {
      for(const talk of timeslot.talks) {
        perRoomIdTalks.set(talk.room.id.value, (perRoomIdTalks.get(talk.room.id.value) || []).concat({ talk, timeslot }))
      }
    }
  }

  return perRoomIdTalks;
}

export function getTemporallyUpcomingTalkIds(timeslots: VoxxrinScheduleTimeSlot[], now: Temporal.ZonedDateTime, talkCompletionThreshold: number = 1.0): TalkId[] {
  const perRoomIdTalksSchedule = getRoomsTalksSchedule(timeslots)

  const roomIds = Array.from(
      perRoomIdTalksSchedule.keys()
    ).sort() // Being deterministic on room ordering is important (for caching purposes)

  return roomIds.reduce((upcomingTalkIds, roomId) => {
    const ongoingOrUpcomingTalks = perRoomIdTalksSchedule.get(roomId)!.filter(talkAndTimeslot => {
      const talkDuration = talkAndTimeslot.timeslot.end.epochMilliseconds - talkAndTimeslot.timeslot.start.epochMilliseconds
      return now.epochMilliseconds < talkAndTimeslot.timeslot.start.epochMilliseconds + talkDuration*talkCompletionThreshold
    })

    if(ongoingOrUpcomingTalks.length) {
      upcomingTalkIds.push(ongoingOrUpcomingTalks[0].talk.id);
    }
    return upcomingTalkIds;
  }, [] as TalkId[])
}

export function getTimeslotLabel(timeslot: VoxxrinScheduleTimeSlot) {
    const start = formatHourMinutes(timeslot.start)
    const end = formatHourMinutes(timeslot.end)
    return {
        id: timeslot.id,
        start,
        end,
        full: `${start} -> ${end}`,
        date: localDateToReadableParts(timeslot.start, useCurrentUserLocale())
    }
}

export function findTalksTimeslotById(dailySchedule: VoxxrinDailySchedule, timeslotId: ScheduleTimeSlotId) {
    const talkTimeslots = dailySchedule.timeSlots.filter(ts => ts.type === 'talks') as VoxxrinScheduleTalksTimeSlot[];
    return talkTimeslots.find(tts => tts.id.isSameThan(timeslotId));
}

export function findTalksTimeslotContainingTalk(dailySchedule: VoxxrinDailySchedule, talkId: TalkId) {
    const talkTimeslots = dailySchedule.timeSlots
        .filter(ts => ts.type === 'talks') as VoxxrinScheduleTalksTimeSlot[];

    const maybeTalkAndTimeslot = talkTimeslots.map(tts => {
        const foundTalk = tts.talks.find(t => t.id.isSameThan(talkId))

        if(!foundTalk) {
            return undefined;
        }

        return { talk: foundTalk, timeslot: tts }
    }).find(talkAndTimeslot => !!talkAndTimeslot);

    return maybeTalkAndTimeslot;
}

export function filterTimeslotsToAutoExpandBasedOn(timeslots: VoxxrinScheduleTimeSlot[], now: Temporal.ZonedDateTime) {
    const expandedTimeslots = timeslots.filter(ts =>
        ts.end.epochMilliseconds > now.epochMilliseconds
    );

    // When there is no auto-expanded timeslot, let's consider we're going to auto-expand
    // EVERY non-break timeslot
    // This will happen on a past day (or at the end of the day for current day)
    if(expandedTimeslots.length === 0) {
        return timeslots.filter(ts => ts.type !== 'break');
    } else {
        return expandedTimeslots;
    }
}

export function extractTalksFromSchedule(dailySchedule: VoxxrinDailySchedule): VoxxrinTalk[] {
    const talks = dailySchedule.timeSlots.reduce((talks, timeslot) => {
        Array.prototype.push.apply(talks, timeslot.type === 'talks' ? timeslot.talks : []);
        return talks;
    }, [] as Array<VoxxrinTalk>);

    return talks;
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
        return `${timeslot.start.toInstant().toString()} || ${complementedDuration}`;
    })

    const voxxrinSchedule: VoxxrinDailySchedule = {
        eventId: new EventId(event.id.value),
        day: new DayId(firestoreSchedule.day),
        timeSlots
    };

    return voxxrinSchedule;
}

export function toFilteredLabelledTimeslotWithFeedback(dailySchedule: VoxxrinDailySchedule, dailyUserFeedbacks: UserDailyFeedbacks|undefined, searchTerms: string|undefined) {
    return dailySchedule.timeSlots.map((ts: VoxxrinScheduleTimeSlot): LabelledTimeslotWithFeedback => {
        const label = getTimeslotLabel(ts);
        if (ts.type === 'break') {
            return {...ts, label, feedback: {status: 'missing'}};
        } else {
            const feedback = findTimeslotFeedback(dailyUserFeedbacks, ts.id);
            const filteredTalks = filterTalksMatching(ts.talks, searchTerms);
            return {...ts, label, talks: filteredTalks, feedback};
        }
    }).filter(ts => (ts.type === 'break' && !searchTerms) || (ts.type === 'talks' && ts.talks.length !== 0));
}
