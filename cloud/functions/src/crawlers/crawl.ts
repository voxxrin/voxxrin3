import * as _ from "lodash";

import {db, info} from "../firebase"
import {crawl as crawlDevoxx} from "./devoxx/crawler"
import { FullEvent } from "../models/Event";

const crawlAll = async function() {
    info("Starting crawling");

    const events = []

    const snapshot = await db.collection("crawlers/devoxx/events").where("crawl", "==", true).get();
    if (snapshot.empty) {
        info("no events to crawl")
    } else {
        for (const doc of snapshot.docs) {
            info("crawling devoxx event " + doc.id)
            const event = await crawlDevoxx(doc.id)
            await saveEvent(event)
            events.push({id: event.id})
        }
    }

    info("Crawling done");
    return events
};

const saveEvent = async function(event: FullEvent) {
    info("saving event " + event.id)

    await db.collection("events").doc(event.id).set(event.info)

    for (const daySchedule of event.daySchedules) {
        await db.collection("events").doc(event.id)
        .collection("days").doc(daySchedule.day)
            .set(daySchedule)
    }
       
    for (const talk of event.talks) {
        info("saving talk " + talk.id + " " + talk.title);
        await db.collection("events").doc(event.id)
        .collection("talks").doc(talk.id)
        .set(talk)
    }    

    for (const talksStat of event.talkStats) {
        // TODO: see if we really want to override stats each time we crawl
        info("saving stats " + talksStat);
        for (const talkStat of talksStat.stats) {
            await db.collection("events").doc(event.id)
            .collection("days").doc(talksStat.day)
            .collection("talksStats").doc(talkStat.id)
            .set(talkStat)
        }
    }
}

export default crawlAll;