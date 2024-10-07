import {CollectionReference, Query} from "firebase-admin/lib/firestore";
import {db} from "../../../firebase";


async function getRawUsersMatching(collectionFilter: (collection: CollectionReference) => Query) {
  return (
    await collectionFilter(
      db.collection('users')
    ).get()
  ).docs;
}

export async function getUserDocsMatching(collectionFilter: (collection: CollectionReference) => Query) {
  return (await getRawUsersMatching(collectionFilter));
}
