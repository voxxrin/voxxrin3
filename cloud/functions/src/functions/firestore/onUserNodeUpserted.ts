import {DocumentSnapshot} from "firebase-functions/lib/v1/providers/firestore";
  import {db} from "../../firebase";
import {defaultUserInfos} from "./onUserCreated";
import {User} from "../../../../../shared/user.firestore";
import {FirestoreEvent, QueryDocumentSnapshot} from "firebase-functions/v2/firestore";
import {Change} from "firebase-functions/lib/common/change";


// Idea of this callback is to enforce some values (like, privateUserId and all the defaultUserInfofs() stuff)
// just in case the node is created by user itself and not by firebase functions backend on user creation
export const onUserNodeUpserted = async (context: FirestoreEvent<QueryDocumentSnapshot|Change<QueryDocumentSnapshot>|undefined, { userId: string }>) => {
  const userId = context.params.userId;
  const baseUser = defaultUserInfos(userId);

  // Keeping db user infos and potentially overwriting it with default user info
  const userDoc = await db.doc(`/users/${userId}`).get() as DocumentSnapshot
  const dbUser = userDoc.data();

  const mergedUser: User = {
    // enforcing all default user fields are defined
    ...baseUser,
    // keeping db user state
    ...dbUser,
    // Enforcing some fields that should never change over time...
    privateUserId: userId,
    // 👇Please, don't do this as this will lead to infinite user node-updated loop...
    // userLastConnection: new Date().toISOString() as ISODatetime,
  }

  if(!userDoc.exists) {
    await userDoc.ref.create(mergedUser)
  } else {
    // important note: if mergedUser is the same than dbUser, we need to skip updating user
    // (this is to avoid infinite loop on user node udpates
    if(JSON.stringify(dbUser) !== JSON.stringify(mergedUser)) {
      await userDoc.ref.set(mergedUser)
    }
  }
}
