import * as functions from "firebase-functions";

import crawlAll from "../../crawlers/crawl"
import {extractMultiQueryParam, extractSingleQueryParam} from "./utils";

const crawl = functions.https.onRequest(async (request, response) => {
    const crawlingToken = extractSingleQueryParam(request, 'crawlingToken')
    const dayIds = extractMultiQueryParam(request, 'dayId')

    try {
        const events = await crawlAll({ crawlingToken, dayIds })
        response.send(JSON.stringify(events, null, '  '));
    }catch(e) {
        response.send(e?.toString());
    }
});

export default crawl
