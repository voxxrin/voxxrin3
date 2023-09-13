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

export type ConferenceOrganizerAllRatings = {
    [talkId: string]: {
        [publicUserId: string]: FeedbackRatings
    }
}
