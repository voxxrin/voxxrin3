import * as functions from "firebase-functions";

import crawlAll from "../../crawlers/crawl"
import {extractMultiQueryParam, extractSingleQueryParam, sendResponseMessage} from "./utils";

const crawl = functions.https.onRequest(async (request, response) => {
    const crawlingToken = extractSingleQueryParam(request, 'crawlingToken')
    const dayIds = extractMultiQueryParam(request, 'dayId')

    try {
        const events = await crawlAll({ crawlingToken, dayIds })
        return sendResponseMessage(response, 200, JSON.stringify(events, null, '  '))
    }catch(e) {
        return sendResponseMessage(response, 500, e?.toString() || "");
    }
});

export default crawl
