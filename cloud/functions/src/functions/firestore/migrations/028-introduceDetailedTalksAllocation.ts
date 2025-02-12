import {getAllEventsDocs} from "../services/event-utils";
import {getEventTalksDocs} from "../services/talk-utils";
import {ISODatetime, Replace} from "../../../../../../shared/type-utils";
import {DetailedTalk} from "../../../../../../shared/daily-schedule.firestore";
import {QueryDocumentSnapshot} from "firebase-admin/lib/firestore";
import {match, P} from "ts-pattern";

type OldDetailedTalk = Replace<DetailedTalk, {
  start: ISODatetime,
  end: ISODatetime,
  allocation: never,
}>

export async function introduceDetailedTalksAllocation(): Promise<"OK"|"Error"> {
  const eventDocs = await getAllEventsDocs({includePrivateSpaces: true})
  await Promise.all([
    ...eventDocs.map(async eventDoc => {
      const eventTalksDocs = (await getEventTalksDocs(eventDoc.ref, eventDoc.id)) as unknown as Array<QueryDocumentSnapshot<OldDetailedTalk | DetailedTalk>>;

      await Promise.all(eventTalksDocs.map(async eventTalkDoc => {
        await match(eventTalkDoc.data())
          .with({ allocation: P.nullish, start: P.string, end: P.string }, async notMigratedDetailedEventTalk => {
             return eventTalkDoc.ref.update("allocation", {
              start: notMigratedDetailedEventTalk.start,
              end: notMigratedDetailedEventTalk.end,
            })
          }).otherwise(async alreadyMigratedDetailedEventTalk => {
            // no op
          })
      }))
    }),
  ])

  return "OK"
}
