import {ISOLocalDate} from "./type-utils";

export type ListableEvent = {
    id: string;
    title: string,
    days: Array<{
        id: string,
        localDate: ISOLocalDate
    }>,
    timezone: string,
    keywords: string[],
    location: {
        country: string,
        city: string
    },
    imageUrl: string,
    websiteUrl: string,
}
