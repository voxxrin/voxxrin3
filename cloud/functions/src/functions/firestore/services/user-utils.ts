import {CollectionReference, Query} from "firebase-admin/lib/firestore";
import {db} from "../../../firebase";
import {Temporal} from "@js-temporal/polyfill";
import {ISODatetime} from "../../../../../../shared/type-utils";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;
import {durationOf} from "../../http/utils";
import DocumentData = firestore.DocumentData;


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

type UserCleaningDuration = {type:'fetch'|'deleteUsers', duration:number}
export async function cleanOutdatedUsers() {
  const MAX_WINDOW_SIZE = 800;
  const oldestValidLastConnectionDate = Temporal.Now.zonedDateTimeISO().subtract({ months: 2 }).toString() as ISODatetime
  const MAXIMUM_NUMBER_OF_FAVS = 0;

  const acc = { durations: [] as Array<UserCleaningDuration>, totalDeletedUsers: 0, totalDurations: 0 }

  let userDocs = (await durationOf(() => findOutdatedUsers({
    oldestValidLastConnectionDate, MAX_WINDOW_SIZE, MAXIMUM_NUMBER_OF_FAVS,
  }), ({ durationInMillis }) => acc.durations.push({type: 'fetch', duration: durationInMillis}))).result

  while(!userDocs.empty && userDocs.size === MAX_WINDOW_SIZE) {
    await deleteOutdatedUsers(userDocs.docs.map(doc => doc.ref), acc)

    userDocs = (await durationOf(() => findOutdatedUsers({
      oldestValidLastConnectionDate, MAX_WINDOW_SIZE, MAXIMUM_NUMBER_OF_FAVS,
    }), ({ durationInMillis }) => acc.durations.push({type: 'fetch', duration: durationInMillis}))).result
  }

  if(userDocs.size) {
    await deleteOutdatedUsers(userDocs.docs.map(doc => doc.ref), acc)
  }

  return acc;
}

async function deleteOutdatedUsers(userRefs: Array<DocumentReference>, acc: { durations: Array<UserCleaningDuration>, totalDeletedUsers: number, totalDurations: number }) {
  await durationOf(
    () => Promise.all(userRefs.map(userRef => deleteUserRefIncludingChildren(userRef))),
    ({ durationInMillis }) => acc.durations.push({type: 'deleteUsers', duration: durationInMillis})
  )

  acc.totalDeletedUsers += userRefs.length
  const fetchDuration = acc.durations[acc.durations.length-2].duration;
  const deleteUsersDuration = acc.durations[acc.durations.length-1].duration;
  const fetchAndDeleteDuration = fetchDuration + deleteUsersDuration
  acc.totalDurations += fetchAndDeleteDuration
  console.info(`Deleted ${acc.totalDeletedUsers} users (+${userRefs.length}) in ${acc.totalDurations}ms (+${fetchDuration} + ${deleteUsersDuration}ms )`)
}

async function deleteUserRefIncludingChildren(userRef: DocumentReference<DocumentData>) {
  await userRef.delete()
}

function findOutdatedUsers({
                             oldestValidLastConnectionDate,
                             MAX_WINDOW_SIZE,
                             MAXIMUM_NUMBER_OF_FAVS,
                           } : {
  oldestValidLastConnectionDate: ISODatetime,
  MAX_WINDOW_SIZE: number,
  MAXIMUM_NUMBER_OF_FAVS: number,
}) {

  // FIXME: exclude authenticated users (they should never be considered outdated)

  return db.collection(`/users`)
    .where(`totalFavs.total`, '<=', MAXIMUM_NUMBER_OF_FAVS)
    .where(`userLastConnection`, '<', oldestValidLastConnectionDate)
    .limit(MAX_WINDOW_SIZE)
    .get()
}
