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

type UserOpsDuration = { type: string, duration: number }
export type WindowedProcessUsersStats = {durations: Array<UserOpsDuration>, totalDuration: number, successes: number, failures: number}

export async function windowedProcessUsers(
  userQuery: Query,
  processUserCallback: (userDoc: QueryDocumentSnapshot<User>, stats: WindowedProcessUsersStats) => Promise<void>,
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
  const stats: WindowedProcessUsersStats = {durations: [], totalDuration: 0, successes: 0, failures: 0}

  const fetchNextUsersWindow = async () => {
    return (await durationOf(
      () =>
        userQuery.limit(maxWindowSize).get() as Promise<QuerySnapshot<User>>,
      ({durationInMillis}) => {
        stats.durations.push({type: 'fetchingWindowedUsers', duration: durationInMillis});
        stats.totalDuration += durationInMillis;
      }
    )).result
  }

  let userDocs = await fetchNextUsersWindow();
  while (!userDocs.empty) {
    try {
      console.log(`Processing ${userDocs.docs.length} users...`)
      const {result: perUserResults, durationInMillis} = await durationOf(async () => {
        const rawResults = await Promise.allSettled(userDocs.docs.map(userDoc => processUserCallback(userDoc, stats)))
        const perUserResults = rawResults.map(((promiseSettled, index) => ({
          success: promiseSettled.status === 'fulfilled',
          userDoc: userDocs.docs[index],
          error: promiseSettled.status === 'rejected' ? promiseSettled.reason : undefined,
        })))
        return perUserResults;
      });

      const successes = perUserResults.filter(r => r.success).length
      const failures = perUserResults.length - successes
      if(failures > 0) {
        console.error(`Some failures were detected:\n${perUserResults.filter(pur => !!pur.error).map(pur => pur.error).join(`\n`)}`)
      }
      stats.durations.push({type: `usersBatchedExecution(${userDocs.docs.length})`, duration: durationInMillis})
      stats.totalDuration += durationInMillis;
      stats.successes += successes
      stats.failures += failures

      await resultsProcessor(perUserResults, durationInMillis);
    } catch(error) {
      console.error(`Error while looping over windowed users: ${error}`)
    }

    userDocs = await fetchNextUsersWindow();
  }

  return stats;
}

async function deleteUserRefIncludingChildren(userRef: DocumentReference<DocumentData>) {
  await userRef.delete()

  // TODO: delete favs & feedbacks sub collections (don't forget space-based data)
}
