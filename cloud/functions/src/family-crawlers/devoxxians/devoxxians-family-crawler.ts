import {z} from "zod";
import {createCrawler, getCrawlersMatching} from "../../functions/firestore/services/crawlers-utils";
import {FieldPath} from "firebase-admin/firestore";
import {match} from "ts-pattern";
import { FamilyCrawlerResult } from "../family-crawlers";

const DEVOXXIAN_EVENT_PARSER = z.object({
  id: z.number(),
  name: z.string(),
  eventCategory: z.enum(["VOXXED", "DEVOXX"]),
  // fromDate: ISO_DATETIME_PARSER,
  // toDate: ISO_DATETIME_PARSER,
  // imageUrl: z.string(),
  // website: z.string(),
  apiURL: z.string(),
})

export async function synchronizeDevoxxiansCrawlers(devoxxiansFamilyCrawler: { kind: 'devoxxians'; url: string; eventFamily: string; spaceToken?: string }, ): Promise<FamilyCrawlerResult[]> {
  const devoxxianFutureEvents = await fetch(devoxxiansFamilyCrawler.url)
    .then(resp => resp.json())
    .then(json => z.array(DEVOXXIAN_EVENT_PARSER).parse(json));

  const results = await Promise.all(devoxxianFutureEvents.map(async (devoxxianFutureEvent): Promise<FamilyCrawlerResult> => {
    const eventId = devoxxianFutureEvent.apiURL.match(/^https?:\/\/([^\.]+)\.cfp\.dev/)?.[1];

    if(!eventId) {
      return { eventName: devoxxianFutureEvent.name, resultType: 'error' as const, errorMessage: `Error while trying to resolve event id from url ${devoxxianFutureEvent.apiURL} for event ${devoxxianFutureEvent.name} (is it a https://<eventId>.cfp.dev url ?)` }
    }

    const crawler = await getCrawlersMatching(crawlerColl => crawlerColl.where(FieldPath.documentId(), "==", eventId));

    const result = await match(crawler)
      .with([], async () => {
        // TODO: would be better if eventName could be provided at devoxxians level
        const eventName = eventId.match(/^([^\d]+)\d+$/)?.[1];

        if(!eventName) {
          return {
            eventName: devoxxianFutureEvent.name,
            resultType: 'error' as const,
            errorMessage: `Error while trying to extract event name from event id ${eventId} for event ${devoxxianFutureEvent.name}`,
          }
        }

        const crawlerBase = {
          kind: 'devoxx',
          eventFamily: devoxxiansFamilyCrawler.eventFamily,
          eventName,
          // TODO: Check if this URL will be the good one
          descriptorUrl: `${devoxxianFutureEvent.apiURL}${devoxxianFutureEvent.apiURL.endsWith("/") ? "" : "/"}public/mobile-descriptor`,
        };

        await createCrawler(eventId, {
          ...crawlerBase,
          ...(devoxxiansFamilyCrawler.spaceToken
              ? { visibility: 'private', spaceToken: devoxxiansFamilyCrawler.spaceToken }
              : { visibility: 'public' }
          ),
        });

        return {
          eventName: devoxxianFutureEvent.name,
          eventId,
          resultType: 'crawler-created' as const,
          message: `Created crawler for event ${devoxxianFutureEvent.name} (event id: ${eventId}). You need to trigger a crawl from cfp.dev instance now.`,
        }
      })
      .otherwise(async ([existingCrawler]) => {
        return {
          eventName: devoxxianFutureEvent.name,
          eventId,
          resultType: 'no-crawling-execution-found-yet' as const,
          message: `No crawling execution found yet for event ${devoxxianFutureEvent.name} (event id: ${eventId}). You need to trigger a crawl from cfp.dev instance.`,
        }
      })

    return result;
  }))

  return results;
}
