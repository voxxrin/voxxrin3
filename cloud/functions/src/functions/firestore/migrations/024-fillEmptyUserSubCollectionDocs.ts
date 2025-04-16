import {db} from "../../../firebase";
import {getAllEventsWithTalksStats, getMaybeSpaceTokenOf} from "../services/event-utils";
import {windowedProcessUsers} from "../services/user-utils";
import {resolvedSpaceFirestorePath} from "@shared/utilities/event-utils";
import {firestore} from "firebase-admin";
import DocumentSnapshot = firestore.DocumentSnapshot;
import {UserDailyFeedbacks, UserTalkNote} from "@shared/feedbacks.firestore";
import {User, UserTotalFeedbacks} from "@shared/user.firestore";
import {match, P} from "ts-pattern";
import {v4 as uuidv4} from "uuid";
import {FieldPath} from "firebase-admin/firestore";


/**
 * It is important to have non-empty documents otherwise those documents cannot be listed on the frontend
 */
export async function fillEmptyUserSubCollectionDocs(): Promise<"OK"|"Error"> {
  await configurableFillEmptyUserSubCollectionDocs();
  return "OK";
}

export async function configurableFillEmptyUserSubCollectionDocs(opts?: {fromUserId?: string, toUserId?: string}) {
  const DRY_RUN = process.env.USER_MIGRATION_DRY_RUN === 'true'; // for testing purposes only
  const migrationsStats = {
      updateTotalFeedbacks: 0,
      updateFeedbackDay: 0,
      updateTalkStats: 0,
      createDayPath: 0,
      createEventPath: 0,
      createSpacePath: 0,
      updateUserModel: 0,
      dailyFeedbacksReads: 0,
      talkFavoritesReads: 0,
  }

  const executeDryRunnableOperation = async (opName: keyof typeof migrationsStats, operation: () => Promise<any>) => {
      if(!DRY_RUN) {
          await operation();
      }
      migrationsStats[opName]++;
  }

  const eventDaysWithStats = (await getAllEventsWithTalksStats({ includePrivateSpaces: true }))
    .flatMap(({ event, allInOneTalkStats }) => event.days.map(day => ({ event, allInOneTalkStats, day })))

  const start = Date.now();
  const intervalId = setInterval(() => {
    console.log(`[${logContext}] After ${(Date.now() - start)/1000}s: ${JSON.stringify(migrationsStats, null, '  ')}`)
  }, 3000);

  const {logContext, userQueryFactory} = match(opts)
    .with(P.nullish.or({ fromUserId: P.nullish, toUserId: P.nullish }), () => ({
      userQueryFactory: () => db.collection("users").where("_version", "==", 3),
      logContext: `.->.`
    })).with({ fromUserId: P.nullish, toUserId: P.string }, ({ toUserId }) => ({
      userQueryFactory: () => db.collection("users").where("_version", "==", 3).where(FieldPath.documentId(), "<", toUserId),
      logContext: `.->${toUserId}`
    })).with({ fromUserId: P.string, toUserId: P.nullish }, ({ fromUserId }) => ({
      userQueryFactory: () => db.collection("users").where("_version", "==", 3).where(FieldPath.documentId(), ">=", fromUserId),
      logContext: `${fromUserId}->.`
    })).otherwise(({ fromUserId, toUserId }) => ({
      userQueryFactory: () => db.collection("users").where("_version", "==", 3).where(FieldPath.documentId(), ">=", fromUserId).where(FieldPath.documentId(), "<", toUserId),
      logContext: `${fromUserId}->${toUserId}`
    }))

  const stats = await windowedProcessUsers(
      userQueryFactory,
      async userDoc => {
          const user = userDoc.data();

          const userPath = `users/${userDoc.id}`

          const feedbacksProcessedPromise = Promise.all(eventDaysWithStats.map(async eventDayWithStats => {
              const event = eventDayWithStats.event;
              const maybeSpaceToken = getMaybeSpaceTokenOf(event);
              const spacePath = `${userPath}${resolvedSpaceFirestorePath(maybeSpaceToken, false, true)}`

              const eventPath = `${spacePath}/events/${event.id}`
              const dayPath = `${eventPath}/days/${eventDayWithStats.day.id}`
              const dailyFeedbacksPath = `${dayPath}/feedbacks/self`

              const dailyFeedbacksDoc = await db.doc(dailyFeedbacksPath).get() as DocumentSnapshot<UserDailyFeedbacks>
              migrationsStats.dailyFeedbacksReads += 1;
              const dailyFeedbacks = dailyFeedbacksDoc.data()
              if(dailyFeedbacksDoc.exists && dailyFeedbacks) {
                  await executeDryRunnableOperation('updateFeedbackDay', () => db.doc(dayPath).set({ dayId: eventDayWithStats.day.id }))
                  return [{ dailyFeedbacksPath, dayPath, eventPath, spacePath, maybeSpaceToken, eventId: eventDayWithStats.event.id, dayId: eventDayWithStats.day.id, feedbacksCount: dailyFeedbacks.feedbacks.length, }];
              } else {
                  return [];
              }
          })).then(feedbacks => feedbacks.flat())

          const favoritesProcessedPromise = user.totalFavs.total === 0
              ? Promise.resolve([])
              : Promise.all(Object.keys(user.totalFavs.perEventTotalFavs).map(async eventId => {
                  const eventDayWithStatsMatchingEvent = eventDaysWithStats.find(edws => edws.event.id === eventId);
                  if(!eventDayWithStatsMatchingEvent) {
                      return [];
                  }

                  const event = eventDayWithStatsMatchingEvent.event;
                  const maybeSpaceToken = getMaybeSpaceTokenOf(event);
                  const spacePath = `${userPath}${resolvedSpaceFirestorePath(maybeSpaceToken, false, true)}`
                  const eventPath = `${spacePath}/events/${event.id}`

                  return await Promise.all(Object.keys(eventDayWithStatsMatchingEvent.allInOneTalkStats).map(async talkId => {
                      const talkPath = `${eventPath}/talksNotes/${talkId}`

                      const talkNotesDoc = await db.doc(talkPath).get() as DocumentSnapshot<UserTalkNote>
                      migrationsStats.talkFavoritesReads += 1;
                      const talkNotes = talkNotesDoc.data();
                      if(talkNotesDoc.exists && talkNotes) {
                        return [{ talkPath, eventPath, spacePath, maybeSpaceToken, eventId, talkId, talkNote: talkNotes.note }]
                      } else {
                        return [];
                      }
                  })).then(favs => favs.flat())
              })).then(favs => favs.flat())

          const [ feedbackEntries, favsEntries ] = await Promise.all([ feedbacksProcessedPromise, favoritesProcessedPromise ])

          const uniqueDayIdByPath = new Map(feedbackEntries
            .map(feedbackEntry => [feedbackEntry.dayPath, {dayId: feedbackEntry.dayId}])
          )

          const uniqueEventIdByPath = new Map(
            ([] as Array<[string, {eventId: string}]>)
              .concat(feedbackEntries.map(feedbackEntry => [feedbackEntry.eventPath, { eventId: feedbackEntry.eventId }]))
              .concat(favsEntries.map(favsEntry => [favsEntry.eventPath, { eventId: favsEntry.eventId }]))
          )

          const uniqueSpaceTokenByPath = new Map(
            ([] as Array<undefined|[string, {spaceToken: string}]>)
              .concat(feedbackEntries.map(feedbackEntry => feedbackEntry.maybeSpaceToken ? [feedbackEntry.spacePath, { spaceToken: feedbackEntry.maybeSpaceToken }] : undefined))
              .concat(favsEntries.map(favEntry => favEntry.maybeSpaceToken ? [favEntry.spacePath, { spaceToken: favEntry.maybeSpaceToken }] : undefined))
              .filter(entry => !!entry).map(entry => entry!)
          )

          const feedbacksCounts: UserTotalFeedbacks = {
            total: feedbackEntries.reduce((total, feedbackEntry) => total + feedbackEntry.feedbacksCount, 0),
            perEventTotalFeedbacks: feedbackEntries.reduce((perEventTotalFeedbacks, feedbackEntry) => {
              perEventTotalFeedbacks[feedbackEntry.eventId] = perEventTotalFeedbacks[feedbackEntry.eventId] || 0
              perEventTotalFeedbacks[feedbackEntry.eventId] += feedbackEntry.feedbacksCount;
              return perEventTotalFeedbacks;
            }, {} as Record<string, number>),
          }

          const nodeCreationPromises = [
            ...[...uniqueDayIdByPath.entries()].map(async ([dayPath, dayEntry]) => executeDryRunnableOperation("createDayPath", () => db.doc(dayPath).set(dayEntry))),
            ...[...uniqueEventIdByPath.entries()].map(async ([eventPath, eventEntry]) => executeDryRunnableOperation("createEventPath", () => db.doc(eventPath).set(eventEntry))),
            ...[...uniqueSpaceTokenByPath.entries()].map(async ([spaceTokenPath, spaceTokenEntry]) => executeDryRunnableOperation("createSpacePath", () => db.doc(spaceTokenPath).set(spaceTokenEntry))),
          ]

          await Promise.all(nodeCreationPromises);

          const userRef = db.doc(userPath)
          const dbUserDoc = await userRef.get() as DocumentSnapshot<User>
          const dbUser = dbUserDoc.data()!;

          await executeDryRunnableOperation("updateUserModel", () => userRef.update({
            "_version": 4,
            privateUserId: userDoc.id,
            totalFeedbacks: feedbacksCounts,
            ...(dbUser.publicUserToken ? {}: {publicUserToken: uuidv4()}),
            ...(dbUser.userCreation ? {}: {userCreation: new Date(0).toISOString()}),
          }))
          console.log(`[${logContext}] User ${userDoc.id} updated (${nodeCreationPromises.length} nodes created !)`)
      }
  )

  console.log(`[${logContext}] Overall statistics: ${JSON.stringify({ stats, migrationsStats }, null, '  ')}`)
  clearInterval(intervalId);

  return { stats, migrationsStats }
}

export async function httpCallAll({baseUrl, token}: { baseUrl: string, token: string }) {
  const LETTERS = "0 1 2 3 4 5 6 7 8 9 A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z".split(" ")
  const results = await Promise.all((LETTERS as Array<string|undefined>).concat(undefined).map(async (_, idx, letters) => {
    const context = {
      ...(letters[idx-1] === undefined ?{}:{ fromUserId: letters[idx-1]}),
      ...(letters[idx] === undefined ?{}:{ toUserId: letters[idx]}),
    }
    const params = new URLSearchParams({
      token,
      ...context,
    })

    const url = `${baseUrl}/api/admin/fillEmptyUserSubCollectionDocs?${params.toString()}`
    console.info(`Calling ${url}`)
    const shardingResult = await fetch(url, {
      method: 'POST',
    }).then(resp => resp.json() as Promise<ReturnType<typeof configurableFillEmptyUserSubCollectionDocs>>)

    return { context, ...shardingResult }
  }))

  return results
}
