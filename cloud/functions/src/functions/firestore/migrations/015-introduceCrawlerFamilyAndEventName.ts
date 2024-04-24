import {getAllRawCrawlers} from "../services/crawlers-utils";
import {match, P} from "ts-pattern";
import {db} from "../../../firebase";


export async function introduceCrawlerFamilyAndEventName(): Promise<"OK"|"Error"> {
  const crawlerSnapshots = await getAllRawCrawlers()

  await Promise.all(crawlerSnapshots.map(async crawlerSnap => {
    const {eventFamily, eventName} = match({ ...crawlerSnap.data(), id: crawlerSnap.id })
      .with({ id: P.string, kind: P.union("devoxx", "devoxx-scala") }, ({ id, kind }) => ({
        eventFamily: (id.startsWith("vd") || id.startsWith("voxxed")) ? "voxxed" : "devoxx",
        eventName: id.replace(/^([^\d]+)\d+$/gi, "$1")
      })).with({ id: P.string, kind: P.string }, ({ kind }) => ({ eventFamily: kind, eventName: kind }))
      .otherwise((crawlerData) => { throw new Error(`Unsupported crawler data: ${JSON.stringify(crawlerData)}`); })

    const eventDoc = db.doc(`events/${crawlerSnap.id}`)
    const eventDescriptorDoc = db.doc(`events/${crawlerSnap.id}/event-descriptor/self`)

    return Promise.all([
      // Adding eventFamily and eventName fields on crawler, event and event-descriptor
      crawlerSnap.ref.update({ eventFamily, eventName, }),
      eventDoc.update({ eventFamily, eventName, }),
      eventDescriptorDoc.update({ eventFamily, eventName, }),
    ])
  }))

  return "OK"
}
