import {sendResponseMessage} from "../utils";
import crawlAll from "../../../crawlers/crawl";
import {Response} from "express";

export async function requestEventScheduleRefresh(response: Response, pathParams: {eventId: string}, queryParams: {token: string, dayIds?: string|undefined}) {
  try {
    const events = await crawlAll({
      crawlingToken: queryParams.token,
      dayIds: queryParams.dayIds && queryParams.dayIds.length ? queryParams.dayIds.split(",") : undefined,
      eventIds: [pathParams.eventId]
    })
    return sendResponseMessage(response, 200, events.length ? events[0] : undefined)
  }catch(e) {
    return sendResponseMessage(response, 500, e?.toString() || "");
  }
}
