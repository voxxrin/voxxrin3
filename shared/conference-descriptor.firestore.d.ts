import {ISOLocalDate} from "./type-utils";

export type Day = {
    id: string,
    localDate: ISOLocalDate
}
export type ConferenceDescriptor = {
    id: string,
    name: string,
    headingName: string,
    days: Array<Day>,
    timezone: string,
    features: {
        roomsDisplayed: boolean,
        favoritesEnabled: boolean,
        remindMeOnceVideosAreAvailableEnabled: boolean,
        // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
        hideLanguages: string[],
        ratings: {},
    },
    talkFormats: Array<{ id: string, title: string, duration: `PT${number}m`, themeColor: string }>,
    talkTracks: Array<{ id: string, title: string, themeColor: string }>,
    supportedTalkLanguages: Array<{ id: string, label: string, themeColor: string }>,
    rooms: Array<{ id: string, title: string }>,
    theming: {
        colors: {
            primary: '#F78125',
            secondary: '#202020',
        }
    },
    infos: {
        venuePicture: string,
        eventDescription: string
    }
}
