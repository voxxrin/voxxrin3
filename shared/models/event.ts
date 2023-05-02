import { ISOLocalDate } from "./type-utils";

export type Day = {
    id: string,
    localDate: ISOLocalDate
}

export interface EventInfo {
    id: string,
    title: string,
    timezone: string,
    start: ISOLocalDate,
    end: ISOLocalDate,
    days: Day[],
    imageUrl: string,
    websiteUrl: string,
    location: { city: string, country: string },
    keywords: string[]
}
