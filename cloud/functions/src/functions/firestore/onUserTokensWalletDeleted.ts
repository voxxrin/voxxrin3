import {db, info} from "../../firebase"
import {EventContext} from "firebase-functions/lib/v1/cloud-functions";
import {QueryDocumentSnapshot} from "firebase-functions/lib/v1/providers/firestore";


/**
 * Purpose of this function is to migrate legacy private/public user tokens from
 * users/:userId/tokens-wallet/self doc to users/:userId doc
 */
export const onUserTokensWalletDeleted = async (change: QueryDocumentSnapshot, context: EventContext<{ userId: string }>) => {
    info(`User tokens wallet deletion triggered for user: ${context.params.userId}`)
    const tokensWalletData = change.data() as { privateUserId: string, publicUserToken: string };

    await db.doc(`users/${context.params.userId}`).update({
      _version: 2,
      ...(tokensWalletData.privateUserId ?{privateUserId: tokensWalletData.privateUserId}:{}),
      ...(tokensWalletData.publicUserToken ?{publicUserToken: tokensWalletData.publicUserToken}:{}),
    })

    info(`User tokens wallet migration performed successully for user ${context.params.userId} !`)
};
