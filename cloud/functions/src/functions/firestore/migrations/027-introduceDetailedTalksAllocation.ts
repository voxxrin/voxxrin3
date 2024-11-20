import {getAllEventsDocs} from "../services/event-utils";
import {getEventTalksDocs} from "../services/talk-utils";
import {ISODatetime, Replace} from "../../../../../../shared/type-utils";
import {DetailedTalk} from "../../../../../../shared/daily-schedule.firestore";
import {QueryDocumentSnapshot} from "firebase-admin/lib/firestore";

type OldDetailedTalk = Replace<DetailedTalk, {
  start: ISODatetime,
  end: ISODatetime,
  allocation: never,
}>

export async function introduceDetailedTalksAllocation(): Promise<"OK"|"Error"> {
  const eventDocs = await getAllEventsDocs({includePrivateSpaces: true})
  await Promise.all([
    ...eventDocs.map(async eventDoc => {
      const oldEventTalksDocs = (await getEventTalksDocs(eventDoc.ref, eventDoc.id)) as unknown as Array<QueryDocumentSnapshot<OldDetailedTalk>>;

      await Promise.all(oldEventTalksDocs.map(async notMigratedDetailedTalkDoc => {
        const notMigratedDetailedEventTalk = notMigratedDetailedTalkDoc.data();
        await notMigratedDetailedTalkDoc.ref.update("allocation", {
          start: notMigratedDetailedEventTalk.start,
          end: notMigratedDetailedEventTalk.end,
        })
      }))
    }),
  ])

  return "OK"
}
