import * as functions from "firebase-functions";
import {db, info} from "../../firebase"
import {UserTokensWallet} from "../../../../../shared/user-tokens-wallet.firestore";
import {v4 as uuidv4} from "uuid";


/**
 * Purpose of this function is to initialize a public user token for every users entries
 */
export const onUserCreated = functions.auth.user().onCreate(async (user, context) => {
    info(`User created triggered: ${user.uid}`)
    await createEmptyUserTokenWallet(user.uid);
});

export async function createEmptyUserTokenWallet(userId: string) {
    const publicUserToken = uuidv4();
    const userTokensWallet: UserTokensWallet = {
        publicUserToken,
        secretTokens: {
            eventOrganizerTokens: [],
            talkFeedbacksViewerTokens: []
        }
    };

    await db
        .collection('users').doc(userId)
        .collection('tokens-wallet').doc('self')
        .set(userTokensWallet)
}
