import * as _ from "lodash";

import {db, info} from "../firebase"
import {crawl as crawlDevoxx} from "./devoxx/crawler"
import { Event } from "../models/Event";

const crawlAll = async function() {
    info("Starting crawling");

    db.collection("events").doc("dvbe22").set({
        id: "dvbe22",
        title: "Devoxx BE 2022",
        start: "2022-10-10",
        end: "2022-10-14",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        // Should fit in a xxx x xxx pixels square
        logo: "https://acme.com/my-conf-logo.png",
        // Should fit in a xxx x xxx pixels rectangle
        backgroundImage: "https://acme.com/background.png",
        location: { city: "Anvers", country: "BE" },
        keywords: [ "Devoxx", "Java", "Kotlin", "Cloud", "Big data", "Web" ],
        mainColor: "#F78125"
      }
    )

    const event = await crawlDevoxx("dvbe22")
    await saveEvent(event)
    info("Crawling done");
    return [event]
};

const saveEvent = async function(event: Event) {
    for (const daySchedule of event.daySchedules) {
        await db.collection("events").doc(event.id)
        .collection("days").doc(daySchedule.day)
            .set(daySchedule)
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