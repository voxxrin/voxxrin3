import {Ref, ref} from "vue";
import {Temporal} from "temporal-polyfill";
import {ISODatetime} from "../../../shared/type-utils";
import {match, P} from "ts-pattern";



type Clock = {
    zonedDateTimeISO: typeof Temporal.Now.zonedDateTimeISO
}

const CLOCK: Ref<Clock> = ref(Temporal.Now)

// Module intended to provide time-based facilities, in order to facilitate mocking time
// everywhere in the app
export function useCurrentClock(): Clock { return CLOCK.value; }

export async function overrideCurrentClock(clock: Clock, callback: (() => Promise<void>)|undefined) {
    const initialClock = CLOCK.value;

    console.debug(`Overriding clock...`)
    CLOCK.value = clock;

    if(callback) {
        try {
            await callback();
        } finally {
            console.debug(`... until initial clock is restored !`)
            CLOCK.value = initialClock;
        }
    }
}

class FixedTimeClock implements Clock {
    constructor(private readonly isoDate: ISODatetime) {}

    zonedDateTimeISO(tzLike: Temporal.TimeZoneLike | undefined): Temporal.ZonedDateTime {
        const tz = match(tzLike)
            .with(undefined, () => Intl.DateTimeFormat().resolvedOptions().timeZone)
            .otherwise(tz => tzLike);

        return Temporal.ZonedDateTime.from(`${this.isoDate}[${tz}]`);
    }
}

class ShiftedTimeClock implements Clock {
    private readonly startingTrueTime: Temporal.ZonedDateTime;
    private readonly shiftedStartingTime: Temporal.ZonedDateTime;
    constructor(shiftedStartingISODateTime: ISODatetime) {
        this.shiftedStartingTime = Temporal.ZonedDateTime.from(shiftedStartingISODateTime);
        this.startingTrueTime = Temporal.Now.zonedDateTimeISO();
    }

    zonedDateTimeISO(tzLike: Temporal.TimeZoneLike | undefined): Temporal.ZonedDateTime {
        const durationSinceStartingTrueTime = this.startingTrueTime.until(Temporal.Now.zonedDateTimeISO(tzLike))
        return this.shiftedStartingTime.add(durationSinceStartingTrueTime);
    }
}

if(import.meta.env.DEV) {
    // May be useful for debug purposes
    (window as any).overrideCurrentClock = overrideCurrentClock;

    (window as any)._overrideCurrentClock = (clockOrDate: Clock | ISODatetime, clockType: 'fixed'|'shifted', temporalDurationOrSeconds?: Temporal.Duration | number | undefined) => {
        const clock = match([clockOrDate, clockType])
            .with([P.string, 'fixed'], ([isoDate, _]) => new FixedTimeClock(isoDate))
            .with([P.string, 'shifted'], ([isoDate, _]) => new ShiftedTimeClock(isoDate))
            .with(([{ zonedDateTimeISO: P.any }, P._]), ([clock, _]) => clock)
            .otherwise(() => { throw new Error(`Unexpected params in _overrideCurrentClock()`); })

        const duration = match(temporalDurationOrSeconds)
            .with(undefined, () => undefined)
            .with(P.number, (seconds) => Temporal.Duration.from({seconds}))
            .otherwise((duration) => duration);

        overrideCurrentClock(clock, duration? () => {
            return new Promise(resolve => {
                setTimeout(resolve, duration.total('milliseconds'));
            })
        }:undefined)
    }
}
