import {getCrawlersMatching} from "../services/crawlers-utils";
import {ensureDocPathExists} from "../firestore-utils";


export async function introduceSpaceTokenDoc(): Promise<"OK"|"Error"> {
  const privateCrawlers = await getCrawlersMatching(coll => coll.where("visibility", "==", "private"));

  const spaceTokens = new Set(privateCrawlers.map(privateCrawler => {
    if(privateCrawler.visibility === 'private') {
      return privateCrawler.spaceToken
    }
    return undefined
  }).filter(spToken => !!spToken).map(spToken => spToken!));

  await Promise.all([...spaceTokens].map(async spaceToken => {
    await ensureDocPathExists(`/spaces/${spaceToken}`, { spaceToken })
  }))

  return "OK"
}
