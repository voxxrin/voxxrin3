import {TalkFeedbacksViewerSecretToken} from "./conference-organizer-space.firestore";

export type UserTokensWallet = {
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
