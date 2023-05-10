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
    websiteUrl: string,
    theming: EventTheme
}
