import {ISOLocalDate} from "./type-utils";

export type ListableEvent = {
    id: string;
    title: string,
    description: string|undefined,
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
    peopleDescription: string|undefined,
    backgroundUrl: string,
    logoUrl: string,
    themeColor: string,
    websiteUrl: string,
}
