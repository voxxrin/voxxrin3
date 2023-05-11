import {ISOLocalDate} from "../../../shared/type-utils";
import {UserLocale} from "@/models/VoxxrinUser";
import {Temporal} from "temporal-polyfill";
import {match, P} from "ts-pattern";
import {useCurrentClock} from "@/state/CurrentClock";
import {useCurrentUserLocale} from "@/state/useCurrentUserLocale";


type ReadableLocalDatePartsOpts = {
    day: Intl.DateTimeFormatOptions['day'],
    month: Intl.DateTimeFormatOptions['month'],
    year: Intl.DateTimeFormatOptions['year'],
    weekday: Intl.DateTimeFormatOptions['weekday'],
}
const DEFAULT_LOCAL_DATE_PARTS_OPTS: ReadableLocalDatePartsOpts = {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "short"
};
export function localDateToReadableParts(localDate: ISOLocalDate|Temporal.ZonedDateTime, userLocale: UserLocale, partOptions: Partial<ReadableLocalDatePartsOpts> = DEFAULT_LOCAL_DATE_PARTS_OPTS) {
    const formatter = new Intl.DateTimeFormat(userLocale.value, { ...DEFAULT_LOCAL_DATE_PARTS_OPTS, ...partOptions });

    const dateParts = formatter.formatToParts(match(localDate)
        .with(P.instanceOf(Temporal.ZonedDateTime), zdt => zdt)
        .with(P.string, isoDate => {
            const zdt = useCurrentClock().zonedDateTimeISO();
            return Temporal.PlainDate.from(isoDate).toZonedDateTime(zdt.timeZone)
        })
        .run().epochMilliseconds
    );

    return {
        day: match(dateParts.find(p => p.type === 'day'))
            .with(undefined, undef => undef)
            .otherwise(part => parseInt(part.value)),
        month: dateParts.find(p => p.type === 'month')?.value,
        year: match(dateParts.find(p => p.type === 'year'))
            .with(undefined, undef => undef)
            .otherwise(part => parseInt(part.value)),
        weekday: dateParts.find(p => p.type === 'weekday')?.value,
        full: dateParts.map(p => p.value).join(''),
        parts: dateParts
    }
}

export type MonthDayFormatOpts = {
    day: Intl.DateTimeFormatOptions['day'],
    month: Intl.DateTimeFormatOptions['month'],
    separator: string
}
const DEFAULT_MONTH_DAY_FORMAT_OPTS: Partial<MonthDayFormatOpts> = {
    day: "numeric",
    month: "short",
}
export function monthDayFormattedRange(start: ISOLocalDate | Temporal.ZonedDateTime, end: ISOLocalDate | Temporal.ZonedDateTime, format: Partial<MonthDayFormatOpts> = DEFAULT_MONTH_DAY_FORMAT_OPTS) {
    const userLocale = useCurrentUserLocale();

    const formatter = new Intl.DateTimeFormat(userLocale.value, {
        ...DEFAULT_MONTH_DAY_FORMAT_OPTS,
        ...format
    });

    const startZDT = match(start)
        .with(P.instanceOf(Temporal.ZonedDateTime), zdt => zdt)
        .otherwise(isoLocalDate => useCurrentClock().zonedDateTimeISO().withPlainDate(isoLocalDate));
    const endZDT = match(end)
        .with(P.instanceOf(Temporal.ZonedDateTime), zdt => zdt)
        .otherwise(isoLocalDate => useCurrentClock().zonedDateTimeISO().withPlainDate(isoLocalDate));

    const rangeParts = formatter.formatRangeToParts(
        new Date(startZDT.epochMilliseconds),
        new Date(endZDT.epochMilliseconds)
    ) as Array<{type: string, value: any}>;

    // Replacing separator
    const transformedRangeParts: typeof rangeParts = rangeParts.map(p => {
        if(format.separator && p.type==='literal' && p.value===' – ') {
            return {...p, value: ` ${format.separator} ` };
        } else {
            return p;
        }
    });

    return transformedRangeParts.map(p => p.value).join("");
}

export function formatHourMinutes(datetime: Temporal.ZonedDateTime) {
    return `${datetime.hour<10?'0':''}${datetime.hour}:${datetime.minute<10?'0':''}${datetime.minute}`;
}

export function zonedDateTimeRangeOf(localDates: ISOLocalDate[], timezone: string) {
    const sortedPlainDates = localDates
        .map(ld => Temporal.PlainDate.from(ld))
        .sort(Temporal.PlainDate.compare);

    const [start, end] = [
        sortedPlainDates[0]
            .toZonedDateTime(timezone)
            .startOfDay(),
        sortedPlainDates[sortedPlainDates.length-1]
            .toZonedDateTime(timezone)
            .startOfDay()
            // "hackish" endOfDay, see https://github.com/tc39/proposal-temporal/issues/2568
            .add({days:1})
            .subtract({nanoseconds:1}),
    ];

    return {start, end};
}
