import {overrideCurrentEventDescriptorInfos} from "@/state/useConferenceDescriptor";
import {overrideListableEventProperties} from "@/state/useAvailableEvents";
import {
    Clock,
    FixedTimeClock,
    overrideCurrentClock,
    ShiftedTimeClock
} from "@/state/useCurrentClock";
import {ISODatetime} from "../../../shared/type-utils";
import {Temporal} from "temporal-polyfill";
import {match, P} from "ts-pattern";


// if(import.meta.env.DEV) {
// May be useful for debug purposes

(window as any)._overrideCurrentEventDescriptorInfos = overrideCurrentEventDescriptorInfos;
(window as any)._overrideListableEventProperties = overrideListableEventProperties;
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

// }
