import {ListableEvent} from "./event-list.firestore";

export type ConferenceDescriptor = ListableEvent & {
    headingTitle: string,
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
    infos: {
        venuePicture: string,
        eventDescription: string
    }
}
