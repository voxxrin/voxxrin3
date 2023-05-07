import {EventId} from "@/models/VoxxrinEvent";
import {Temporal} from 'temporal-polyfill';
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinDailySchedule} from "@/models/VoxxrinSchedule";
import {ref, Ref} from "vue";
import {match} from "ts-pattern";
import {useCurrentClock} from "@/state/CurrentClock";

const CACHED_DAILY_SCHEDULE_CONSIDERED_OUTDATED_AFTER = Temporal.Duration.from({ hours: 2 })

const PER_EVENT_CACHED_SCHEDULES = new Map<string, PerEventCachedSchedules>();

export function useDailyCachedSchedule(eventId: EventId, dayId: DayId) {
    let eventCachedSchedules = PerEventCachedSchedules.getByEventId(eventId);
    return match(eventCachedSchedules.findCachedScheduleByDay(dayId))
        .with(undefined, () => undefined)
        .otherwise(cachedDailySchedule =>
            cachedDailySchedule.isCachedOutdated()?undefined:cachedDailySchedule
        );
}

export function storeDailyCachedSchedule(eventId: EventId, dayId: DayId, schedule: VoxxrinDailySchedule) {
    let eventCachedSchedules = PerEventCachedSchedules.getByEventId(eventId);
    eventCachedSchedules.updateDailySchedule(dayId, schedule);
}

export class PerDayCachedSchedule {
    private readonly scheduleRef: Ref<VoxxrinDailySchedule>;
    private latestCacheRefresh: Temporal.Instant;
    constructor(
        public readonly dayId: DayId,
        schedule: VoxxrinDailySchedule,
    ) {
        this.scheduleRef = ref(schedule);
        this.latestCacheRefresh = useCurrentClock().zonedDateTimeISO().toInstant();
    }

    updateSchedule(schedule: VoxxrinDailySchedule) {
        this.scheduleRef.value = schedule;
        this.latestCacheRefresh = useCurrentClock().zonedDateTimeISO().toInstant();
    }

    schedule() {
        return this.scheduleRef.value;
    }
    scheduleCacheRefresh(): Temporal.Instant {
        return this.latestCacheRefresh
    }
    isCachedOutdated() {
        const isOutdated = Temporal.Instant.compare(
            useCurrentClock().zonedDateTimeISO().toInstant(),
            this.latestCacheRefresh.add(CACHED_DAILY_SCHEDULE_CONSIDERED_OUTDATED_AFTER)
        ) === 1;
        // console.log(`cache outdated ? ${isOutdated}`);
        return isOutdated;
    }
}

class PerEventCachedSchedules {
    constructor(public readonly eventId: EventId, private readonly perDayCachedSchedules: PerDayCachedSchedule[]) {
    }

    updateDailySchedule(dayId: DayId, schedule: VoxxrinDailySchedule) {
        return match(this.findCachedScheduleByDay(dayId))
            .with(undefined, () => {
                const perDayCachedSchedule = new PerDayCachedSchedule(dayId, schedule)
                this.perDayCachedSchedules.push(perDayCachedSchedule);
                return perDayCachedSchedule;
            })
            .otherwise(perDaySchedule => {
                perDaySchedule.updateSchedule(schedule)
                return perDaySchedule;
            })
    }

    findCachedScheduleByDay(dayId: DayId) {
        return this.perDayCachedSchedules.find(dcs => dcs.dayId.isSameThan(dayId));
    }

    static getByEventId(eventId: EventId) {
        if(!PER_EVENT_CACHED_SCHEDULES.has(eventId.value)) {
            PER_EVENT_CACHED_SCHEDULES.set(eventId.value, new PerEventCachedSchedules(eventId, []));
        }
        return PER_EVENT_CACHED_SCHEDULES.get(eventId.value)!;
    }
}
