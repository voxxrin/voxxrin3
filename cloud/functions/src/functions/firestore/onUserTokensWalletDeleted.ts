import {db, info} from "../../firebase"
import {QueryDocumentSnapshot} from "firebase-functions/v2/firestore";
import {FirestoreEvent} from "firebase-functions/v2/firestore";
import {FieldValue} from "firebase-admin/firestore";


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
      _version: 3,
      _modelRemainingMigrations: FieldValue.arrayRemove("delete-remote-tokens-wallet"),
      ...(tokensWalletData.privateUserId ?{privateUserId: tokensWalletData.privateUserId}:{}),
      ...(tokensWalletData.publicUserToken ?{publicUserToken: tokensWalletData.publicUserToken}:{}),
    })

    info(`User tokens wallet migration performed successully for user ${event.params.userId} !`)
};
