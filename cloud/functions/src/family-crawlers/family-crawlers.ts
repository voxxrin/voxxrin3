import {ISODatetime} from "../../../../shared/type-utils";
import {CrawlingResult} from "../crawlers/crawl";
import {match} from "ts-pattern";
import { FIREBASE_FAMILY_CRAWLER_PARSER } from "./family-crawler-parsers";
import { z } from "zod";
import { synchronizeDevoxxiansCrawlers } from "./devoxxians/devoxxians-family-crawler";

export type FamilyCrawlerResult = { eventName: string, } & (
  | { resultType: 'error', errorMessage: string }
  | { resultType: 'crawler-created', eventId: string, message: string }
  | { resultType: 'no-crawling-execution-found-yet', eventId: string, message: string }
  | { resultType: 'last-crawling-execution-found', eventId: string, crawlingExecution: { startedAt: ISODatetime; duration: `${number}ms`; result: CrawlingResult } }
  );

export async function resolveCurrentFamilyCrawlers(familyCrawler: z.infer<typeof FIREBASE_FAMILY_CRAWLER_PARSER>) {
  const currentCrawlersResults = await match(familyCrawler)
    .with({ kind: "devoxxians" }, ({ url }) => synchronizeDevoxxiansCrawlers(familyCrawler))
    .exhaustive();

  return currentCrawlersResults;
}
