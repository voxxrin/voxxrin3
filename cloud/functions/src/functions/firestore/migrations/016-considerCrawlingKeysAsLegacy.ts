import {getAllRawCrawlers} from "../services/crawlers-utils";
import {FieldValue} from "firebase-admin/firestore";


export async function considerCrawlingKeysAsLegacy(): Promise<"OK"|"Error"> {
  const crawlerSnapshots = await getAllRawCrawlers()

  await Promise.all(crawlerSnapshots.map(async crawlerSnap => {
    return crawlerSnap.ref.update({
      // renaming crawlingKeys to legacyCrawlingKeys
      crawlingKeys: FieldValue.delete(), legacyCrawlingKeys: crawlerSnap.data().crawlingKeys,
    })
  }))

  return "OK"
}
