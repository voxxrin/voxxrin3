import {db} from "../../../firebase";
import {UserTokensWallet} from "../../../../../../shared/user-tokens-wallet.firestore";
import {firestore} from "firebase-admin";
import DocumentSnapshot = firestore.DocumentSnapshot;

type UserTokensWalletWithoutFirebaseMessagingTokens = Omit<UserTokensWallet, "secretTokens"> & {
    secretTokens: Omit<UserTokensWallet['secretTokens'], 'firebaseMessagingTokens'> & {
        firebaseMessagingTokens: undefined
    }
}
export async function initializeFirebaseMessagingTokens(): Promise<"OK"|"Error"> {
    const existingUsers = await db.collection("users").listDocuments()

    await Promise.all(existingUsers.map(async existingUser => {
        const tokensWalletDoc = await db
            .collection("users").doc(existingUser.id)
            .collection("tokens-wallet").doc("self")
            .get() as DocumentSnapshot<UserTokensWalletWithoutFirebaseMessagingTokens>

        if(tokensWalletDoc.exists) {
            const tokensWallet = tokensWalletDoc.data();
            if(tokensWallet && !tokensWallet.secretTokens.firebaseMessagingTokens) {
                const userWalletWithInitizalized: UserTokensWallet = {
                    ...tokensWallet,
                    secretTokens: {
                        ...tokensWallet.secretTokens,
                        firebaseMessagingTokens: []
                    }
                }
                await db
                    .collection('users').doc(existingUser.id)
                    .collection('tokens-wallet').doc('self')
                    .set(userWalletWithInitizalized)
            }
        }
    }))

    return "OK";
}
