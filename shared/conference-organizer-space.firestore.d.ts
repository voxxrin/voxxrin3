import {FeedbackRatings} from "./talk-feedbacks.firestore";

export type TalkFeedbacksViewerSecretToken = {
    secretToken: string;
    eventId: string;
    speakersFullNames: string[];
    talkId: string;
}

export type ConferenceOrganizerSpace = {
    organizerSecretToken: string;
    talkFeedbackViewerTokens: TalkFeedbacksViewerSecretToken[];
}

export type PerPublicUserIdFeedbackRatings = {
    [publicUserId: string]: FeedbackRatings
}

export type DailyTalkFeedbackRatings = {
    [taklId: string]: PerPublicUserIdFeedbackRatings
}
