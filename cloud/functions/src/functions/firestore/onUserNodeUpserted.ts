import {DocumentSnapshot} from "firebase-functions/lib/v1/providers/firestore";
import {EventContext} from "firebase-functions/lib/v1/cloud-functions";
import {db} from "../../firebase";
import {defaultUserInfos} from "./onUserCreated";
import {User} from "../../../../../shared/user.firestore";


export const onUserNodeUpserted = async (context: EventContext<{ userId: string }>) => {
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

  // important note: if mergedUser is the same than dbUser, nothing will be really called
  // (this is to avoid infinite loop on user node udpates
  await userDoc.ref.update(mergedUser)
}
