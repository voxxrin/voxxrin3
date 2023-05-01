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

export async function overrideCurrentClock(clock: Clock, callback: () => Promise<void>) {
    const initialClock = CLOCK.value;
    try {
        console.debug(`Overriding clock...`)
        CLOCK.value = clock;
        await callback();
    } finally {
        console.debug(`... until initial clock is restored !`)
        CLOCK.value = initialClock;
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

if(import.meta.env.DEV) {
    // May be useful for debug purposes
    (window as any).overrideCurrentClock = overrideCurrentClock;

    (window as any).overrideCurrentClockDuring = (clockOrDate: Clock | ISODatetime, temporalDurationOrSeconds: Temporal.Duration | number) => {
        const clock = match(clockOrDate)
            .with(P.string, (isoDate: ISODatetime) => new FixedTimeClock(isoDate))
            .otherwise((clock) => clock);

        const duration = match(temporalDurationOrSeconds)
            .with(P.number, (seconds) => Temporal.Duration.from({seconds}))
            .otherwise((duration) => duration);

        overrideCurrentClock(clock, () => {
            return new Promise(resolve => {
                setTimeout(resolve, duration.total('milliseconds'));
            })
        })
    }
}
