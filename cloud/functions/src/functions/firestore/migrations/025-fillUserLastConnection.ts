import {db} from "../../../firebase";
import {windowedProcessUsers} from "../services/user-utils";
import {match, P} from "ts-pattern";
import {FieldPath} from "firebase-admin/firestore";


/**
 * It is important to have non-empty documents otherwise those documents cannot be listed on the frontend
 */
export async function fillUserLastConnection(): Promise<"OK"|"Error"> {
  let updateCounts = 0
  const stats = await windowedProcessUsers(
    (maybeLastPreviousUserDoc) => match(maybeLastPreviousUserDoc)
      .with(P.nullish, () => db.collection('users'))
      .otherwise(lastPreviousUserDoc => db.collection('users').where(FieldPath.documentId(), '>', lastPreviousUserDoc.id)),
    async userDoc => {
      const user = userDoc.data();
      if(!user.userLastConnection) {
        await userDoc.ref.update("userLastConnection", new Date(0).toISOString());
        updateCounts++;
      }
    }
  )

  console.log(`${updateCounts} user with empty userLastConnection field have been updated (in ${stats.totalDuration}ms) !`)
  return "OK";
}
