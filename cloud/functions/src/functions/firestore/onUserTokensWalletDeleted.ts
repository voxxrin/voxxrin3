import {db, info} from "../../firebase"
import {QueryDocumentSnapshot} from "firebase-functions/lib/v2/providers/firestore";
import {FirestoreEvent} from "firebase-functions/lib/v2/providers/firestore";


/**
 * Purpose of this function is to migrate legacy private/public user tokens from
 * users/:userId/tokens-wallet/self doc to users/:userId doc
 */
export const onUserTokensWalletDeleted = async (event: FirestoreEvent<QueryDocumentSnapshot|undefined, { userId: string }>) => {
    info(`User tokens wallet deletion triggered for user: ${event.params.userId}`)
    if(!event.data) {
      return;
    }

    const tokensWalletData = event.data.data() as { privateUserId: string, publicUserToken: string };

    await db.doc(`users/${event.params.userId}`).update({
      privateUserId: tokensWalletData.privateUserId,
      publicUserToken: tokensWalletData.publicUserToken,
      _version: 2
    })

    info(`User tokens wallet migration performed successully for user ${event.params.userId} !`)
};
