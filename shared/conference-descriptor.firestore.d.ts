import {ListableEvent} from "./event-list.firestore";
import {HexColor} from "./type-utils";

export type ConferenceDescriptor = ListableEvent & {
    headingTitle: string,
    features: {
        roomsDisplayed: boolean,
        favoritesEnabled: boolean,
        remindMeOnceVideosAreAvailableEnabled: boolean,
        // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
        hideLanguages: string[],
        ratings: {
            bingo: {
                enabled: boolean,
                choices: Array<{
                    id: string,
                    label: string
                }>,
            },
            scale: {
                enabled: boolean,
                icon: "star" | "thumbs-up",
                labels: [string, string, string]
                    | [string, string, string, string]
                    | [string, string, string, string, string]
                    | [string, string, string, string, string, string]
                    | [string, string, string, string, string, string, string]
            },
            "free-text": {
                enabled: boolean,
                maxLength: number,
            },
            "custom-scale": {
                enabled: boolean,
                choices: Array<{
                    id: string,
                    icon: string,
                }>
            }
        },
    },
    talkFormats: Array<{ id: string, title: string, duration: `PT${number}m`, themeColor: HexColor }>,
    talkTracks: Array<{ id: string, title: string, themeColor: HexColor }>,
    supportedTalkLanguages: Array<{ id: string, label: string, themeColor: HexColor }>,
    rooms: Array<{ id: string, title: string }>,
    infos: {
        venuePicture: string,
        eventDescription: string
    }
}
