import * as functions from "firebase-functions";

import crawlAll from "../../crawlers/crawl"

const crawl = functions.https.onRequest((request, response) => {
    crawlAll({
        dayId: Array.isArray(request.query.dayId)?request.query.dayId[0]?.toString():request.query.dayId?.toString()
    }).then((events) => {
        response.send(JSON.stringify(events, null, 2));
    })
});

export default crawl
