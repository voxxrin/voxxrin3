import {TalkFeedbacksViewerSecretToken} from "./conference-organizer-space.firestore";

export type UserTokensWallet = {
    publicUserToken: string;
    secretTokens: {
        eventOrganizerTokens: EventOrganizerSecretToken[],
        talkFeedbacksViewerTokens: TalkFeedbacksViewerSecretToken[]
    }
}

export type EventOrganizerSecretToken = {
    token: string;
    eventId: string;
}
