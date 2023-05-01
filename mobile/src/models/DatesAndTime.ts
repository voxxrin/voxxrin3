import {ISOLocalDate} from "../../../shared/type-utils";
import {UserLocale} from "@/models/VoxxrinUser";


type ReadableLocalDatePartsOpts = {
    day: Intl.DateTimeFormatOptions['day'],
    month: Intl.DateTimeFormatOptions['month'],
    year: Intl.DateTimeFormatOptions['year'],
    weekday: Intl.DateTimeFormatOptions['weekday'],
}
const DEFAULT_LOCAL_DATE_PARTS_OPTS: ReadableLocalDatePartsOpts = {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "short"
};
export function localDateToReadableParts(localDate: ISOLocalDate, userLocale: UserLocale, partOptions: Partial<ReadableLocalDatePartsOpts> = DEFAULT_LOCAL_DATE_PARTS_OPTS) {
    const formatter = new Intl.DateTimeFormat(userLocale.value, { ...DEFAULT_LOCAL_DATE_PARTS_OPTS, ...partOptions });

    const dateParts = formatter.formatToParts(new Date(localDate));

    return {
        day: parseInt(dateParts.find(p => p.type === 'day')!.value),
        month: dateParts.find(p => p.type === 'month')!.value,
        year: parseInt(dateParts.find(p => p.type === 'year')!.value),
        weekday: dateParts.find(p => p.type === 'weekday')!.value,
        full: dateParts.map(p => p.value).join('')
    }
}
