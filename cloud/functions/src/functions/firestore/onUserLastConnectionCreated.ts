import {QueryDocumentSnapshot} from "firebase-functions/lib/v1/providers/firestore";
import {EventContext} from "firebase-functions/lib/v1/cloud-functions";
import {db} from "../../firebase";
import {firestore} from "firebase-admin";
import {User} from "../../../../../shared/user.firestore";
import DocumentSnapshot = firestore.DocumentSnapshot;
import {UserLastConnection} from "../../../../../shared/user-last-connection.firestore";
import {createUserInfos} from "./onUserCreated";

export const onUserLastConnectionCreated = async (snapshot: QueryDocumentSnapshot, context: EventContext<{ userId: string }>) => {
  const userId = context.params.userId;
  // Checking if user infos have been created: if not, creating it
  // This can happen in multiple cases:
  // - onUserCreated() has not been called (yet)
  // - user has been considered outdated and has been cleant (this allows to re-create a well formed user data in case
  // someone doesn't connect to voxxrin for a very long time)
  const userDoc = await db.doc(`/users/${userId}`).get() as DocumentSnapshot<User>
  const user = userDoc.data();
  const userLastConnection = snapshot.data() as UserLastConnection;
  if(!userDoc.exists || !user) {
    await createUserInfos(userId)
  }

  // Updating user last connection in main document
  await userDoc.ref.update("userLastConnection", userLastConnection.userLastConnection)
}
