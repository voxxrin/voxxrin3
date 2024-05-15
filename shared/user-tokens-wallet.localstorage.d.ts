
export type UserTokensWallet = {
    privateUserId: string;
    publicUserToken: string;
    secretTokens: {
        eventOrganizerTokens: UserWalletEventOrganizerSecretToken[],
        talkFeedbacksViewerTokens: UserWalletTalkFeedbacksViewerSecretToken[]
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
