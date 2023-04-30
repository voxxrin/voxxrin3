

export type ConferenceDescriptor = {
    id: string,
    days: string[],
    features: {
        roomsDisplayed: boolean,
        favoritesEnabled: boolean,
        remindMeOnceVideosAreAvailableEnabled: boolean,
        // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
        hideLanguages: string[],
        ratings: {},
    },
    talkFormats: Array<{ id: string, label: string, themeColor: string }>,
    talkTracks: Array<{ id: string, label: string, themeColor: string }>,
    supportedTalkLanguages: Array<{ id: string, label: string, themeColor: string }>,
    rooms: Array<{ id: string, label: string }>,
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
