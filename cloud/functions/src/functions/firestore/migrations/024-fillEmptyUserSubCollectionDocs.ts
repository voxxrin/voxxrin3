import {db} from "../../../firebase";
import {getAllEventsDocs, getAllEventsWithTalks} from "../services/event-utils";
import {windowedProcessUsers} from "../services/user-utils";
import {resolvedEventFirestorePath, resolvedSpaceFirestorePath} from "../../../../../../shared/utilities/event-utils";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "firebase-admin";
import DocumentSnapshot = firestore.DocumentSnapshot;
import {UserDailyFeedbacks, UserTalkNote} from "../../../../../../shared/feedbacks.firestore";
import {UserTotalFeedbacks} from "../../../../../../shared/user.firestore";


/**
 * It is important to have non-empty documents otherwise those documents cannot be listed on the frontend
 */
export async function fillEmptyUserSubCollectionDocs(): Promise<"OK"|"Error"> {
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

  const eventDaysWithStats = (await getAllEventsWithTalks({ includePrivateSpaces: true }))
    .flatMap(({ event, allInOneTalkStats }) => event.days.map(day => ({ event, allInOneTalkStats, day })))

  const start = Date.now();
  const intervalId = setInterval(() => {
    console.log(`After ${(Date.now() - start)/1000}s: ${JSON.stringify(migrationsStats, null, '  ')}`)
  }, 3000);

  const stats = await windowedProcessUsers(
      db.collection("users").where("_version", "==", 3),
      async userDoc => {
          const user = userDoc.data();

          const userPath = `users/${userDoc.id}`

          const feedbacksProcessedPromise = Promise.all(eventDaysWithStats.map(async eventDayWithStats => {
              const event = eventDayWithStats.event;
              const maybeSpaceToken = event.visibility === 'private' ? event.spaceToken : undefined
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
                  const maybeSpaceToken = event.visibility === 'private' ? event.spaceToken : undefined
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

          await executeDryRunnableOperation("updateUserModel", () => db.doc(userPath).update({
            "_version": 4,
            "totalFeedbacks": feedbacksCounts,
          }))
          console.log(`User ${userDoc.id} updated (${nodeCreationPromises.length} nodes created !)`)
      }
  )

  console.log(`Overall statistics: ${JSON.stringify({ stats, migrationsStats }, null, '  ')}`)
  clearInterval(intervalId);

  return "OK"
}

