import {ISOLocalDate} from "../../../shared/type-utils";
import {UserLocale} from "@/models/VoxxrinUser";
import {Temporal} from "temporal-polyfill";
import {match, P} from "ts-pattern";
import {useCurrentClock} from "@/state/useCurrentClock";
import {useCurrentUserLocale} from "@/state/useCurrentUser";


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
export type WeekDayMonthYearFormatOps = MonthDayFormatOpts & {
    weekday: Intl.DateTimeFormatOptions['weekday']
    year: Intl.DateTimeFormatOptions['year']
}

const DEFAULT_MONTH_DAY_FORMAT_OPTS: Partial<MonthDayFormatOpts> = {
    day: "numeric",
    month: "short",
}
const DEFAULT_WEEKDAY_MONTH_YEAR_FORMAT_OPTS: Partial<WeekDayMonthYearFormatOps> = {
    ...DEFAULT_MONTH_DAY_FORMAT_OPTS,
    weekday: "short",
    year: "numeric"
}

function userDateTimeFormatterFrom<T extends Intl.DateTimeFormatOptions>(format: Partial<T>, defaultFormat: Partial<T>) {
    const userLocale = useCurrentUserLocale();

    return new Intl.DateTimeFormat(userLocale.value, {
        ...defaultFormat,
        ...format
    });
}

function mergeParts(parts: Array<{type: string, value: string}>, separator: string|undefined) {
    // Replacing separator
    const transformedRangeParts: typeof parts = parts.map(p => {
        if(separator && p.type==='literal' && p.value===' – ') {
            return {...p, value: ` ${separator} ` };
        } else {
            return p;
        }
    });

    return transformedRangeParts.map(p => p.value).join("");
}

export function weekDayMonthYearFormattedDate(date: Temporal.ZonedDateTime, format: Partial<WeekDayMonthYearFormatOps> = DEFAULT_WEEKDAY_MONTH_YEAR_FORMAT_OPTS) {
    const formatter = userDateTimeFormatterFrom(format, DEFAULT_WEEKDAY_MONTH_YEAR_FORMAT_OPTS);
    const parts = formatter.formatToParts(new Date(date.epochMilliseconds)) as Array<{type: string, value: any}>

    return mergeParts(parts, format.separator);
}

export function monthDayFormattedRange(start: ISOLocalDate | Temporal.ZonedDateTime, end: ISOLocalDate | Temporal.ZonedDateTime, format: Partial<MonthDayFormatOpts> = DEFAULT_MONTH_DAY_FORMAT_OPTS) {
    const formatter = userDateTimeFormatterFrom(format, DEFAULT_MONTH_DAY_FORMAT_OPTS);

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

    return mergeParts(rangeParts, format.separator);
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

export function toISOLocalDate(zdt: Temporal.ZonedDateTime): ISOLocalDate {
    return zdt.toPlainDate().toString() as ISOLocalDate;
}

export function toHMMDuration(duration: `PT${number}m`): string {
    const temporalDuration = Temporal.Duration.from(duration)

    let totalMinutes = temporalDuration.total('minutes');
    const hours = Math.floor(totalMinutes/60);
    const minutes = totalMinutes % 60;

    return `${hours===0?'':`${hours}h`}${(hours>0 && minutes>0)?' ':''}${minutes===0?'':`${(minutes<10 && hours>0)?'0':''}${minutes}m`}`
}
