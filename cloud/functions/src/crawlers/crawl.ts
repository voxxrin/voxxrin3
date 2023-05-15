import * as _ from "lodash";

import {db, info} from "../firebase"
import {crawl as crawlDevoxx} from "./devoxx/crawler"
import { FullEvent } from "../models/Event";

const crawlAll = async function() {
    info("Starting crawling");

    const events: Array<{id: string}> = []

    const snapshot = await db.collection("crawlers/devoxx/events").where("crawl", "==", true).get();
    if (snapshot.empty) {
        info("no events to crawl")
    } else {
        await Promise.all(snapshot.docs.map(async doc => {
            info("crawling devoxx event " + doc.id)
            const event = await crawlDevoxx(doc.id)
            await saveEvent(event)
            events.push({id: event.id})
        }))
    }

    info("Crawling done");
    return events
};

const saveEvent = async function(event: FullEvent) {
    info("saving event " + event.id)

    await db.collection("events").doc(event.id).set(event.info)

    const firestoreEvent = await db.collection("events").doc(event.id);
    await Promise.all(event.daySchedules.map(async daySchedule => {
        await firestoreEvent
            .collection("days").doc(daySchedule.day)
            .set(daySchedule)
    }))
    await Promise.all(event.talks.map(async talk => {
        info("saving talk " + talk.id + " " + talk.title);
        await firestoreEvent
            .collection("talks").doc(talk.id)
            .set(talk)
    }));
    await Promise.all(
        event.talkStats
            .flatMap(dailyTalksStat =>
                dailyTalksStat.stats.map(stat => ({day: dailyTalksStat.day, stat: stat }))
            ).map(async talkStatWithDay => {
            // TODO: see if we really want to override stats each time we crawl
            await firestoreEvent
                .collection("days").doc(talkStatWithDay.day)
                .collection("talksStats").doc(talkStatWithDay.stat.id)
                .set(talkStatWithDay.stat)
        })
    )
}

export default crawlAll;
