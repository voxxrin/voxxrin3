import {Ref, ref} from "vue";
import {Temporal} from "temporal-polyfill";
import {ISODatetime} from "../../../shared/type-utils";
import {match, P} from "ts-pattern";



export type Clock = {
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

export class FixedTimeClock implements Clock {
    constructor(private readonly isoDate: ISODatetime) {}

    zonedDateTimeISO(tzLike: Temporal.TimeZoneLike | undefined): Temporal.ZonedDateTime {
        const tz = match(tzLike)
            .with(undefined, () => Intl.DateTimeFormat().resolvedOptions().timeZone)
            .otherwise(tz => tzLike);

        return Temporal.ZonedDateTime.from(`${this.isoDate}[${tz}]`);
    }
}

export class ShiftedTimeClock implements Clock {
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
