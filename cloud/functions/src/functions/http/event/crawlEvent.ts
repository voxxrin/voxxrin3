import {sendResponseMessage} from "../utils";
import crawlAll from "../../../crawlers/crawl";
import {Response} from "express";

export async function requestCrawlerScheduleRefresh(response: Response, pathParams: {crawlerId: string}, queryParams: {token: string, dayIds?: string|undefined}) {
  try {
    const { crawlerId } = pathParams
    const events = await crawlAll({
      crawlingToken: queryParams.token,
      dayIds: queryParams.dayIds && queryParams.dayIds.length ? queryParams.dayIds.split(",") : undefined,
      crawlerIds: [crawlerId]
    })
    return sendResponseMessage(response, 200, events.length ? events[0] : undefined)
  }catch(e) {
    return sendResponseMessage(response, 500, e?.toString() || "");
  }
}
