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
import {UserTokensWallet} from "../../../../../../shared/user-tokens-wallet.localstorage";
import DocumentSnapshot = firestore.DocumentSnapshot;
import {match, P} from "ts-pattern";
import {FieldPath} from "firebase-admin/firestore";


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

export async function cleanOutdatedUsers(opts: { force: boolean, dryRun: boolean } = { force: false, dryRun: false }) {
  const oldestValidLastConnectionDate = Temporal.Now.zonedDateTimeISO().subtract({months: 2}).toString() as ISODatetime
  const MAXIMUM_NUMBER_OF_FAVS = 0;
  const MAXIMUM_NUMBER_OF_FEEDBACKS = 0;

  const stats = await windowedProcessUsers(
    (maybePreviousResults) => {
      const baseQuery = db.collection(`/users`)
        .where(`totalFavs.total`, '<=', MAXIMUM_NUMBER_OF_FAVS)
        .where(`totalFeedbacks.total`, '<=', MAXIMUM_NUMBER_OF_FEEDBACKS)
        .where(`userLastConnection`, '<', oldestValidLastConnectionDate)
      return match(maybePreviousResults)
        .with(P.nullish,
          () => baseQuery
        ).otherwise(maybeLastPreviousUserDoc => baseQuery.where(FieldPath.documentId(), '>', maybeLastPreviousUserDoc.id))
    },
    userDoc => deleteUserRefIncludingChildren(userDoc.ref, opts),
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
  userQueryFactory: (maybeLastPreviousUserDoc: undefined|QueryDocumentSnapshot<User>, maybePreviousResults: undefined|QuerySnapshot<User>) => Query,
  processUserCallback: (userDoc: QueryDocumentSnapshot<User>, stats: WindowedProcessUsersStats) => Promise<void>,
  {maxWindowSize, resultsProcessor}: {
    maxWindowSize: number,
    resultsProcessor: (results: Array<{
      userDoc: QueryDocumentSnapshot<User>,
      success: boolean
    }>, durationInMillis: number) => Promise<void>
  } = {
    maxWindowSize: process.env.USER_MIGRATION_WINDOW_SIZE ? Number(process.env.USER_MIGRATION_WINDOW_SIZE) : 800, resultsProcessor: async () => {}
  }
) {
  const stats: WindowedProcessUsersStats = {durations: [], totalDuration: 0, successes: 0, failures: 0}

  const fetchNextUsersWindow = async (maybePreviousResults: undefined|QuerySnapshot<User>) => {
    return (await durationOf(
      () =>
        userQueryFactory(maybePreviousResults ? maybePreviousResults.docs[maybePreviousResults.docs.length-1]:undefined, maybePreviousResults).limit(maxWindowSize).get() as Promise<QuerySnapshot<User>>,
      ({durationInMillis}) => {
        stats.durations.push({type: 'fetchingWindowedUsers', duration: durationInMillis});
        stats.totalDuration += durationInMillis;
      }
    )).result
  }

  let userDocs = await fetchNextUsersWindow(undefined);
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

    const previousUserDocsHash = userDocs.docs.map(doc => doc.id).join(",")
    userDocs = await fetchNextUsersWindow(userDocs);
    const newUserDocsHash = userDocs.docs.map(doc => doc.id).join(",")
    if(previousUserDocsHash === newUserDocsHash) {
      throw new Error(`Stable users results detected: did you provide a discriminator in your query ?`)
    }
  }

  return stats;
}

async function deleteUserRefIncludingChildren(userRef: DocumentReference<DocumentData>, {force, dryRun}: { force: boolean, dryRun: boolean } = { force: false, dryRun: false }) {
  const tokensWalletDoc = await db.doc(`${userRef.path}/tokens-wallet/self`).get() as DocumentSnapshot<UserTokensWallet>
  const walletSecrets = tokensWalletDoc.data()?.secretTokens;

  if(!force && tokensWalletDoc.exists && walletSecrets && (
    (walletSecrets.eventOrganizerTokens && walletSecrets.eventOrganizerTokens.length)
    || (walletSecrets.privateSpaceTokens && walletSecrets.privateSpaceTokens.length)
    || (walletSecrets.talkFeedbacksViewerTokens && walletSecrets.talkFeedbacksViewerTokens.length)
  )) {
    console.info(`Not deleting user ${userRef.id} because he has tokens-wallet non-empty collection`)
    throw new Error(`Not deleting user ${userRef.id} because he has tokens-wallet non-empty collection`)
  }

  const preferencesDoc = await db.doc(`${userRef.path}/preferences/self`).get()
  // For legacy reasons
  const legacyLastConnectionDoc = await db.doc(`${userRef.path}/last-connection/self`).get()

  await Promise.all([
    deleteUserSpaces(userRef, { dryRun }),
    deleteUserEventsFromNode(userRef, { dryRun }),
    ...((preferencesDoc.exists && !dryRun) ? [preferencesDoc.ref.delete()]:[]),
    ...((tokensWalletDoc.exists && !dryRun) ? [tokensWalletDoc.ref.delete()]:[]),
    ...((legacyLastConnectionDoc.exists && !dryRun) ? [legacyLastConnectionDoc.ref.delete()]:[]),
  ])

  console.info(`Deleting user entry ${userRef.path}`)
  if(!dryRun) {
    await userRef.delete()
  }
}

async function deleteUserEventsFromNode(rootRef: DocumentReference, {dryRun}: { dryRun: boolean } = { dryRun: false }) {
  const eventRefs = await db.collection(`${rootRef.path}/events`).listDocuments();

  await Promise.all(eventRefs.map(async eventRef => {
    console.debug(`Deleting user event entry ${eventRef.path}...`)
    return Promise.all([
      deleteUserTalkNotesFromEvent(eventRef, { dryRun }),
      deleteUserDailyFeedbacksFromEvent(eventRef, { dryRun }),
      ...(!dryRun ? [eventRef.delete()]:[]),
    ])
  }))
}

async function deleteUserSpaces(userRef: DocumentReference<DocumentData>, {dryRun}: { dryRun: boolean } = { dryRun: false }) {
  const spaceRefs = await db.collection(`${userRef.path}/spaces`).listDocuments()

  await Promise.all(spaceRefs.map(async spaceRef => {
    console.debug(`Deleting user space entry ${spaceRef.path}...`)
    return Promise.all([
      deleteUserEventsFromNode(spaceRef, { dryRun }),
      ...(!dryRun ? [spaceRef.delete()]:[]),
    ])
  }))
}

async function deleteUserTalkNotesFromEvent(eventRef: DocumentReference<DocumentData>, {dryRun}: { dryRun: boolean } = { dryRun: false }) {
  const talkNotesRefs = await db.collection(`${eventRef.path}/talksNotes`).listDocuments()

  await Promise.all(talkNotesRefs.map(async talkNotesRef => {
    console.debug(`Deleting user talk notes entry ${talkNotesRef.path}...`)
    if(!dryRun) {
      await talkNotesRef.delete()
    }
  }))
}

async function deleteUserDailyFeedbacksFromEvent(eventRef: DocumentReference<DocumentData>, {dryRun}: { dryRun: boolean } = { dryRun: false }) {
  const dailyFeedbackRefs = await db.collection(`${eventRef.path}/days`).listDocuments()

  await Promise.all(dailyFeedbackRefs.map(async dailyFeedbackRef => {
    console.debug(`Deleting user daily feedback entry ${dailyFeedbackRef.path}...`)
    if(!dryRun) {
      await Promise.all([
        db.doc(`${dailyFeedbackRef.path}/feedbacks/self`).delete(),
        dailyFeedbackRef.delete(),
      ])
    }
  }))
}

