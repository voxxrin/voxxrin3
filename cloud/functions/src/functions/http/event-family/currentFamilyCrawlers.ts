import {sendResponseMessage} from "../utils";
import {Response} from "express";
import {FIREBASE_FAMILY_CRAWLER_PARSER} from "../../../family-crawlers/family-crawler-parsers";
import {z} from "zod";
import {resolveCurrentFamilyCrawlers} from "../../../family-crawlers/family-crawlers";


export async function currentFamilyCrawlers(response: Response, pathParams: {familyCrawlerId: string}, queryParams: {token: string}, familyCrawler: z.infer<typeof FIREBASE_FAMILY_CRAWLER_PARSER>) {
  try {
    return sendResponseMessage(response, 200, await resolveCurrentFamilyCrawlers(familyCrawler))
  }catch(e) {
    return sendResponseMessage(response, 500, e?.toString() || "");
  }
}
