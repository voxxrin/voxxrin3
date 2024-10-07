import {db} from "../../../firebase";
import {UserTalkNote} from "../../../../../../shared/feedbacks.firestore";
import {User, UserTotalFavs} from "../../../../../../shared/user.firestore";
import { CollectionReference, FieldPath } from "firebase-admin/firestore";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;


export async function forEachUsers(limit: number, startingId: string|undefined, callback: (userDoc: DocumentReference<User>) => Promise<void>){
  let usersColl = db.collection("users").orderBy(FieldPath.documentId());
  if(startingId) {
    usersColl = usersColl.startAt(startingId);
  }

  const userDocs = (
    await usersColl
      .limit(limit)
      .get()
  ).docs;

  await Promise.all(userDocs.map(async userDoc => {
    await callback(userDoc.ref as DocumentReference<User>);
  }))

  return {
    lastUserId: userDocs[userDocs.length-1].id,
    count: userDocs.length
  }
}
