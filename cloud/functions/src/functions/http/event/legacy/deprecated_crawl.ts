import {https} from "firebase-functions";
import {Response} from 'express';

import crawlAll from "../../../../crawlers/crawl"
import {extractMultiQueryParam, extractSingleQueryParam, sendResponseMessage} from "../../utils";

export async function crawl(request: https.Request, response: Response) {
    const crawlingToken = extractSingleQueryParam(request, 'crawlingToken')
    const dayIds = extractMultiQueryParam(request, 'dayId')
    const eventIds = extractMultiQueryParam(request, 'eventId')

    try {
        const events = await crawlAll({ crawlingToken, dayIds, crawlerIds: eventIds })
        return sendResponseMessage(response, 200, events)
    }catch(e) {
        return sendResponseMessage(response, 500, e?.toString() || "");
    }
}
