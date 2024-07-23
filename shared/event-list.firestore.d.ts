import {HexColor, ISODatetime, ISOLocalDate} from "./type-utils";

export type EventTheme = {
    colors: {
        primaryHex: HexColor,
        primaryContrastHex: HexColor,
        secondaryHex: HexColor,
        secondaryContrastHex: HexColor,
        tertiaryHex: HexColor,
        tertiaryContrastHex: HexColor
    }
}

export type Day = {
    id: string,
    localDate: ISOLocalDate
}

export type ListableEvent = {
    id: string;
    eventFamily: string,
    eventName: string,
    title: string,
    description?: string|undefined|null,
    days: Array<Day>,
    timezone: string,
    keywords: string[],
    location: {
        country: string,
        city: string,
        address?: string|undefined,
        coords?: { latitude: number, longitude: number }|undefined,
    },
    peopleDescription?: string|undefined|null,
    backgroundUrl: string,
    logoUrl: string,
    websiteUrl: string,
    theming: EventTheme
}

export type PrivateListableEvent = ListableEvent & { spaceToken: string }

export type EventLastUpdates = {
    favorites: ISODatetime|undefined,
    allFeedbacks: ISODatetime|undefined|null,
    feedbacks: { [talkId: string]: ISODatetime|null }|undefined,
    talkListUpdated: ISODatetime|undefined,
}
