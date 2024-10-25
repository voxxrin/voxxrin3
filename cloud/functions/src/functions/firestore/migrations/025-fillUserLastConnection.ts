import {db} from "../../../firebase";
import {getAllEventsWithTalks} from "../services/event-utils";
import {windowedProcessUsers} from "../services/user-utils";
import {resolvedSpaceFirestorePath} from "../../../../../../shared/utilities/event-utils";
import {firestore} from "firebase-admin";
import DocumentSnapshot = firestore.DocumentSnapshot;
import {UserDailyFeedbacks, UserTalkNote} from "../../../../../../shared/feedbacks.firestore";
import {User, UserTotalFeedbacks} from "../../../../../../shared/user.firestore";
import {match, P} from "ts-pattern";
import {v4 as uuidv4} from "uuid";


/**
 * It is important to have non-empty documents otherwise those documents cannot be listed on the frontend
 */
export async function fillUserLastConnection(): Promise<"OK"|"Error"> {
  let updateCounts = 0
  const stats = await windowedProcessUsers(
    db.collection('users'),
    async userDoc => {
      const user = userDoc.data();
      if(!user.userLastConnection) {
        await userDoc.ref.update("userLastConnection", new Date(0).toISOString());
        updateCounts++;
      }
    }
  )

  console.log(`${updateCounts} user with empty userLastConnection field have been updated !`)
  return "OK";
}
