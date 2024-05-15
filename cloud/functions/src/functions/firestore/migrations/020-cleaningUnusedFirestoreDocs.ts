import {db} from "../../../firebase";
import {getAllRawCrawlers} from "../services/crawlers-utils";
import {FieldValue} from "firebase-admin/firestore";
import {getAllEventDescriptorDocs} from "../services/eventDescriptor-utils";


export async function cleaningUnusedFirestoreDocs(): Promise<"OK"|"Error"> {
  await Promise.all([
    (async () => {
      const eventFamilyTokensColl = await db.collection(`event-family-tokens`).get()
      if(!eventFamilyTokensColl.empty) {
        await Promise.all(eventFamilyTokensColl.docs.map(async eventFamilyToken => {
          return eventFamilyToken.ref.delete()
        }))
      }
    })(),
    (async () => {
      const crawlersDocs = await getAllRawCrawlers();
      await Promise.all(crawlersDocs.map(async crawlerDoc => {
        await crawlerDoc.ref.update({
          stopAutoCrawlingAfter: FieldValue.delete(),
          legacyCrawlingKeys: FieldValue.delete(),
        })
      }))
    })(),
    (async () => {
      const eventDescriptorsDocs = await getAllEventDescriptorDocs()
      await Promise.all(eventDescriptorsDocs.map(async eventDescriptorDoc => {
        await eventDescriptorDoc.ref.update({
          websiteUrl: FieldValue.delete()
        })
      }))
    })(),
  ])

  return "OK"
}
