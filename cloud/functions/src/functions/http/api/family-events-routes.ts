import type {Express} from "express";
import {Routes} from "./routes";
import * as z from "zod";
import {getFamilyOrganizerToken} from "../../firestore/services/publicTokens-utils";
import {FIREBASE_FAMILY_CRAWLER_PARSER} from "../../../family-crawlers/family-crawler-parsers";
import {getFamilyCrawlersMatching} from "../../firestore/services/family-crawlers-utils";
import {FieldPath} from "firebase-admin/firestore";

async function resolveCrawlerFamilyById({ familyCrawlerId }: { familyCrawlerId: string }): Promise<z.infer<typeof FIREBASE_FAMILY_CRAWLER_PARSER>> {
  const familyCrawlerDescriptors = await getFamilyCrawlersMatching(familyCrawlerColl => familyCrawlerColl.where(FieldPath.documentId(), "==", familyCrawlerId))

  if(!familyCrawlerDescriptors.length) {
    throw new Error(`No family crawler found with id ${familyCrawlerId}`)
  }

  return familyCrawlerDescriptors[0];
}


export function declareFamilyEventsHttpRoutes(app: Express) {
  Routes.get(app, `/family-crawlers/:familyCrawlerId/crawlers`,
    z.object({
      query: z.object({
        token: z.string().min(10),
      }),
      path: z.object({
        familyCrawlerId: z.string().min(10),
      })
    }),
    async (pathParams: { familyCrawlerId: string }, queryParams: { token: string }) => {
      const token = queryParams.token;

      const familyCrawler = await resolveCrawlerFamilyById(pathParams);
      const matchingPublicToken = await getFamilyOrganizerToken(token);

      if(!familyCrawler.eventFamily || !matchingPublicToken.eventFamilies.includes(familyCrawler.eventFamily)) {
        throw new Error(`Provided event family-based token doesn't match with family crawler ${pathParams.familyCrawlerId} family: [${familyCrawler.eventFamily}]`)
      }

      return familyCrawler;
    },
    async (res, path, query, familyCrawler) =>
      (await import("../event-family/currentFamilyCrawlers")).currentFamilyCrawlers(res, path, query, familyCrawler));
}
