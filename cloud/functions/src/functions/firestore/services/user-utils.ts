import {CollectionReference, Query, QueryDocumentSnapshot} from "firebase-admin/lib/firestore";
import {db} from "../../../firebase";
import {Temporal} from "@js-temporal/polyfill";
import {ISODatetime} from "../../../../../../shared/type-utils";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;
import {durationOf} from "../../http/utils";
import DocumentData = firestore.DocumentData;
import QuerySnapshot = firestore.QuerySnapshot;
import {User} from "../../../../../../shared/user.firestore";


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

type UserOpsDuration = { type: 'fetch' | 'exec', duration: number }

export async function cleanOutdatedUsers() {
  const oldestValidLastConnectionDate = Temporal.Now.zonedDateTimeISO().subtract({months: 2}).toString() as ISODatetime
  const MAXIMUM_NUMBER_OF_FAVS = 0;

  const stats = await windowedProcessUsers(
    db.collection(`/users`)
      .where(`totalFavs.total`, '<=', MAXIMUM_NUMBER_OF_FAVS)
      .where(`userLastConnection`, '<', oldestValidLastConnectionDate),
    (userDoc) => deleteUserRefIncludingChildren(userDoc.ref),
  )

  return {
    durations: stats.durations,
    totalDuration: stats.totalDuration,
    totalDeletedUsers: stats.successes,
    failures: stats.failures
  }
}

export async function windowedProcessUsers(
  userQuery: Query,
  processUserCallback: (userDoc: QueryDocumentSnapshot<User>) => Promise<void>,
  {maxWindowSize, resultsProcessor}: {
    maxWindowSize: number,
    resultsProcessor: (results: Array<{
      userDoc: QueryDocumentSnapshot<User>,
      success: boolean
    }>, durationInMillis: number) => Promise<void>
  } = {
    maxWindowSize: 800, resultsProcessor: async () => {
    }
  }
) {
  const stats = {durations: [] as Array<UserOpsDuration>, totalDuration: 0, successes: 0, failures: 0}

  const fetchNextUsersWindow = async () => {
    return (await durationOf(
      () =>
        userQuery.limit(maxWindowSize).get() as Promise<QuerySnapshot<User>>,
      ({durationInMillis}) => {
        stats.durations.push({type: 'fetch', duration: durationInMillis});
        stats.totalDuration += durationInMillis;
      }
    )).result
  }

  let userDocs = await fetchNextUsersWindow();
  while (!userDocs.empty) {
    const {result: perUserResults, durationInMillis} = await durationOf(async () => {
      const rawResults = await Promise.allSettled(userDocs.docs.map(userDoc => processUserCallback(userDoc)))
      const perUserResults = rawResults.map(((promiseSettled, index) => ({
        success: promiseSettled.status === 'fulfilled',
        userDoc: userDocs.docs[index]
      })))
      return perUserResults;
    });

    const successes = perUserResults.filter(r => r.success).length
    stats.durations.push({type: 'exec', duration: durationInMillis})
    stats.totalDuration += durationInMillis;
    stats.successes += successes
    stats.failures += perUserResults.length - successes

    await resultsProcessor(perUserResults, durationInMillis);

    userDocs = await fetchNextUsersWindow();
  }

  return stats;
}

async function deleteUserRefIncludingChildren(userRef: DocumentReference<DocumentData>) {
  await userRef.delete()

  // TODO: delete favs & feedbacks sub collections (don't forget space-based data)
}
