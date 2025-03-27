import {HexColor, ISODatetime, ISOLocalDate} from "./type-utils";

export type EventTheme = {
    colors: {
        primaryHex: HexColor,
        primaryContrastHex: HexColor,
        secondaryHex: HexColor,
        secondaryContrastHex: HexColor,
        tertiaryHex: HexColor,
        tertiaryContrastHex: HexColor
    },
    headingCustomStyles: {
      title: string|null,
      subTitle: string|null,
      banner: string|null,
    }|null,
    headingSrcSet: Array<{ url: string, descriptor: string }>|null,
    customGoogleFontFamilies: string[]|null
}

export type Day = {
    id: string,
    localDate: ISOLocalDate
}

export type ListableEventVisibility =
  | { visibility: "public" }
  | { visibility: "private", spaceToken: string }

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
} & ListableEventVisibility;

export type EventLastUpdates = {
    favorites: ISODatetime|undefined,
    allFeedbacks: ISODatetime|undefined|null,
    feedbacks: { [talkId: string]: ISODatetime|null }|undefined,
    talkListUpdated: ISODatetime|undefined,
}
