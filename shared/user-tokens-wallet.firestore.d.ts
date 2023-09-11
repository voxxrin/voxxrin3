import {TalkFeedbacksViewerSecretToken} from "./conference-organizer-space.firestore";

export type UserTokensWallet = {
    privateUserId: string;
    publicUserToken: string;
    secretTokens: {
        eventOrganizerTokens: EventOrganizerSecretToken[],
        talkFeedbacksViewerTokens: TalkFeedbacksViewerSecretToken[]
    }
}

export type EventOrganizerSecretToken = {
    secretToken: string;
    eventId: string;
}
