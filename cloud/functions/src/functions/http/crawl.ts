import * as functions from "firebase-functions";

import crawlAll from "../../crawlers/crawl"

function extractSingleQueryParam(request: functions.https.Request, paramName: string) {
    const value  = request.query[paramName];
    return Array.isArray(value)?value[0]?.toString():value?.toString();
}

function extractMultiQueryParam(request: functions.https.Request, paramName: string): string[] {
    const value  = request.query[paramName];
    return (Array.isArray(value)?value.map(v => v.toString()):[ value?.toString() ].filter(v => !!v)) as string[];
}

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
