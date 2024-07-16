
export type UserTokensWallet = {
    secretTokens: {
        eventOrganizerTokens: UserWalletEventOrganizerSecretToken[],
        talkFeedbacksViewerTokens: UserWalletTalkFeedbacksViewerSecretToken[],
        privateSpaceTokens: UserWalletPrivateSpaceToken[],
    }
}

export type UserWalletEventOrganizerSecretToken = {
    secretToken: string;
    eventId: string;
}

export type UserWalletTalkFeedbacksViewerSecretToken = {
  secretToken: string;
  eventId: string;
  talkId: string;
}

export type UserWalletPrivateSpaceToken = {
  secretToken: string;
  spaceTokens: string[];
}
