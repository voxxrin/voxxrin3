import {FeedbackRatings, TalkAttendeeFeedback} from "./talk-feedbacks.firestore";

export type TalkFeedbacksViewerSecretToken = {
    secretToken: string;
    eventId: string;
    talkId: string;
}

export type ConferenceOrganizerSpace = {
    organizerSecretToken: string;
    talkFeedbackViewerTokens: TalkFeedbacksViewerSecretToken[];
}

export type PerPublicUserIdFeedbackRatings = {
    [publicUserId: string]: FeedbackRatings
}
