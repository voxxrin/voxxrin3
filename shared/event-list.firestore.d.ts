import {HexColor, ISOLocalDate} from "./type-utils";

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
    title: string,
    description?: string|undefined|null,
    days: Array<Day>,
    timezone: string,
    keywords: string[],
    location: {
        country: string,
        city: string
    },
    peopleDescription?: string|undefined|null,
    backgroundUrl: string,
    logoUrl: string,
    websiteUrl: string,
    theming: EventTheme
}
