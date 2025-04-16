import {
  UserWalletTalkFeedbacksViewerSecretToken,
  UserWalletEventOrganizerSecretToken, UserTokensWallet
} from "@shared/user-tokens-wallet.localstorage";
import {match, P} from "ts-pattern";


export type LegacyUserTokensWallet = {
  secretTokens: {
    eventOrganizerTokens: UserWalletEventOrganizerSecretToken[],
    talkFeedbacksViewerTokens: UserWalletTalkFeedbacksViewerSecretToken[]
  }
}
export async function introduceUserWalletPrivateSpaceToken(userId: string): Promise<"OK"|"Error"> {
  const userTokensWallet: UserTokensWallet = match(localStorage.getItem(`user:${userId}:tokens-wallet`))
    .with(P.nullish, () => ({
      secretTokens: {
        eventOrganizerTokens: [],
        talkFeedbacksViewerTokens: [],
        privateSpaceTokens: [],
      },
    })).otherwise((content) => {
      const legacyPrivateSpaceToken: LegacyUserTokensWallet = JSON.parse(content);
      return {
        secretTokens: {
          privateSpaceTokens: [],
          ...legacyPrivateSpaceToken.secretTokens,
        },
      }
    })

  localStorage.setItem(`user:${userId}:tokens-wallet`, JSON.stringify(userTokensWallet))

  return "OK";
}
