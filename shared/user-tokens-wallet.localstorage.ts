
export type UserTokensWallet = {
    secretTokens: {
        eventOrganizerTokens: UserWalletEventOrganizerSecretToken[],
        talkFeedbacksViewerTokens: UserWalletTalkFeedbacksViewerSecretToken[],
        privateSpaceTokens: UserWalletPrivateSpaceToken[],
    }
}

export type UserWalletEventOrganizerSecretToken = {
    secretToken: string;
    spaceToken?: string|undefined;
    eventId: string;
}

export type UserWalletTalkFeedbacksViewerSecretToken = {
  secretToken: string;
  spaceToken?: string|undefined;
  eventId: string;
  talkId: string;
}

export type UserWalletPrivateSpaceToken = {
  name: string;
  spaceTokens: string[];
}
