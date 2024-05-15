import {db} from "../../../firebase";
import {getAllRawCrawlers} from "../services/crawlers-utils";
import {FieldValue} from "firebase-admin/firestore";


export async function cleaningUnusedFirestoreDocs(): Promise<"OK"|"Error"> {
  const eventFamilyTokensColl = await db.collection(`event-family-tokens`).get()
  if(!eventFamilyTokensColl.empty) {
    await Promise.all(eventFamilyTokensColl.docs.map(async eventFamilyToken => {
      return eventFamilyToken.ref.delete()
    }))
  }

  const crawlersDocs = await getAllRawCrawlers();
  await Promise.all(crawlersDocs.map(async crawlerDoc => {
    await crawlerDoc.ref.update({
      stopAutoCrawlingAfter: FieldValue.delete(),
      legacyCrawlingKeys: FieldValue.delete(),
    })
  }))

  return "OK"
}
