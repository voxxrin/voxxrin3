import {TalkFeedbacksViewerSecretToken} from "./conference-organizer-space.firestore";

export type UserTokensWallet = {
    privateUserId: string;
    publicUserToken: string;
    secretTokens: {
        eventOrganizerTokens: UserWalletEventOrganizerSecretToken[],
        talkFeedbacksViewerTokens: UserWallerTalkFeedbacksViewerSecretToken[]
    }
}

export type UserWalletEventOrganizerSecretToken = {
    secretToken: string;
    eventId: string;
}

export type UserWallerTalkFeedbacksViewerSecretToken = {
  secretToken: string;
  eventId: string;
  talkId: string;
}
