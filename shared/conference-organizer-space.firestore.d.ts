
export type TalkFeedbacksViewerSecretToken = {
    secretToken: string;
    eventId: string;
    talkId: string;
}

export type ConferenceOrganizerSpace = {
    organizerSecretToken: string;
    talkFeedbackViewerTokens: TalkFeedbacksViewerSecretToken[];
}
