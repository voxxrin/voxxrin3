import * as functions from "firebase-functions";
import {db, info} from "../../firebase"
import {UserTokensWallet} from "../../../../../shared/user-tokens-wallet.firestore";
import {v4 as uuidv4} from "uuid";
import {User} from "../../../../../shared/user.firestore";
import {ISODatetime} from "../../../../../shared/type-utils";


/**
 * Purpose of this function is to initialize a public user token for every users entries
 */
export const onUserCreated = functions.auth.user().onCreate(async (user, context) => {
    info(`User created triggered: ${user.uid}`)
    await createEmptyUserTokenWallet(user.uid);
    await createUserInfos(user.uid);
});

export async function createEmptyUserTokenWallet(userId: string) {
    const publicUserToken = uuidv4();
    const userTokensWallet: UserTokensWallet = {
        privateUserId: userId,
        publicUserToken,
        secretTokens: {
            firebaseMessagingTokens: [],
            eventOrganizerTokens: [],
            talkFeedbacksViewerTokens: []
        }
    };

    await db
        .collection('users').doc(userId)
        .collection('tokens-wallet').doc('self')
        .set(userTokensWallet)
}

export async function createUserInfos(userId: string) {
    const user: User = {
        userCreation: new Date().toISOString() as ISODatetime,
        username: `Anonymous${generateRandom15DigitInteger()}`
    }

    await db.collection('users').doc(userId).set(user);
}

function generateRandom15DigitInteger() {
    const nineDigits = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
    const sixDigits = Math.floor(Math.random() * 1e6).toString().padStart(6, '0');

    return nineDigits + sixDigits;
}
