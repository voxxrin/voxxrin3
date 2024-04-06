import {ListableEvent} from "./event-list.firestore";
import {HexColor, SocialMediaType} from "./type-utils";
import {ThemedTalkFormat, ThemedTrack} from "./daily-schedule.firestore";

export type ConferenceDescriptor = ListableEvent & {
    headingTitle: string,
    features: {
        roomsDisplayed: boolean,
        favoritesEnabled: boolean,
        remindMeOnceVideosAreAvailableEnabled: boolean,
        showInfosTab?: boolean,
        // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
        hideLanguages: string[],
        ratings: {
            bingo: {
                enabled: boolean,
                isPublic?: boolean|undefined,
                choices: Array<{
                    id: string,
                    label: string
                }>,
            },
            scale: {
                enabled: boolean,
                icon: "star"|"thumbs-up",
                labels: [string,string,string]
                    |[string,string,string,string]
                    |[string,string,string,string,string]
                    |[string,string,string,string,string,string]
                    |[string,string,string,string,string,string, string]
            },
            "free-text": {
                enabled: boolean,
                maxLength: number,
            },
            "custom-scale": {
                enabled: boolean,
                choices: Array<{
                    id: string,
                    icon: "happy"|"sad"|"thumbs-up"|"hand-right"|"thumbs-down",
                }>
            }
        },
        topRatedTalks?: {
            minimumNumberOfRatingsToBeConsidered: number,
            minimumAverageScoreToBeConsidered?: number|undefined,
            numberOfDailyTopTalksConsidered: number
        }|undefined
    },
    talkFormats: Array<ThemedTalkFormat>,
    talkTracks: Array<ThemedTrack>,
    supportedTalkLanguages: Array<{ id: string, label: string, themeColor: HexColor }>,
    rooms: Array<{ id: string, title: string }>,
    infos?: {
        floorPlans?: Array<{
            label: string, pictureUrl: string
        }>|undefined,
        socialMedias?: Array<{
            type: SocialMediaType, href: string
        }>|undefined,
        sponsors?: Array<{
            type: string, typeColor: string, typeFontColor?: string,
            sponsorships: Array<{
                name: string, logoUrl: string, href: string
            }>
        }>|undefined,
    },
}
