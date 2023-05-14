import * as functions from "firebase-functions";

import crawlAll from "../../crawlers/crawl"

const crawl = functions.https.onRequest((request, response) => {
    crawlAll().then((events) => {
        response.send(JSON.stringify(events, null, 2));
    })
});

export default crawl