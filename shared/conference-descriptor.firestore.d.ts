import {ISOLocalDate} from "./type-utils";
import {EventTheme} from "./event-list.firestore";

export type Day = {
    id: string,
    localDate: ISOLocalDate
}
export type ConferenceDescriptor = {
    id: string,
    name: string,
    headingName: string,
    description: string,
    days: Array<Day>,
    timezone: string,
    keywords: string[],
    location: {
        country: string,
        city: string
    },
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
    peopleDescription: string|undefined,
    backgroundUrl: string,
    logoUrl: string,
    websiteUrl: string,
    theming: EventTheme
    infos: {
        venuePicture: string,
        eventDescription: string
    }
}
