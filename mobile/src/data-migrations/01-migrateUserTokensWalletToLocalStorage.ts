import {db} from "@/state/firebase";
import {doc, DocumentReference, getDoc, deleteDoc} from "firebase/firestore";
import {
  UserWalletTalkFeedbacksViewerSecretToken,
  UserWalletEventOrganizerSecretToken
} from "@shared/user-tokens-wallet.localstorage";
import {match, P} from "ts-pattern";


export type LegacyUserTokensWallet = {
  privateUserId: string;
  publicUserToken: string;
  secretTokens: {
    eventOrganizerTokens: UserWalletEventOrganizerSecretToken[],
    talkFeedbacksViewerTokens: UserWalletTalkFeedbacksViewerSecretToken[]
  }
}
export async function migrateUserTokensWalletToLocalStorage(userId: string): Promise<"OK"|"Error"> {
  if(!localStorage.getItem(`user:${userId}:tokens-wallet`)) {
    const tokensWalletDoc = doc(db, `users/${userId}/tokens-wallet/self`) as DocumentReference<LegacyUserTokensWallet>
    const tokensWalletSnap = await getDoc(tokensWalletDoc)

    const migratedTokensWallet = await match([tokensWalletSnap.exists(), tokensWalletSnap.data()])
      .with([true, P.nonNullable], async ([_, tokensWallet]) => {
        await deleteDoc(tokensWalletDoc);

        return {
          secretTokens: tokensWallet.secretTokens
        }
      }).otherwise(async () => ({
        secretTokens: {
          eventOrganizerTokens: [],
          talkFeedbacksViewerTokens: []
        }
      }))

    localStorage.setItem(`user:${userId}:tokens-wallet`, JSON.stringify(migratedTokensWallet));
  }

  return "OK";
}
