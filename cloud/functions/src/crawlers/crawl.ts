import * as _ from "lodash";

import {db, info} from "../firebase"
import {crawl as crawlDevoxx} from "./devoxx/crawler"
import { FullEvent } from "../models/Event";
import { EventInfo } from "../../../../shared/models/event";

const crawlAll = async function() {
    info("Starting crawling");

    db.collection("events").doc("dvbe22").set({
        id: "dvbe22",
        title: "Devoxx BE 2022",
        timezone: "Europe/Brussels",
        start: "2022-10-10",
        end: "2022-10-14",
        days: [
            {id: "monday", localDate: "2022-10-10"}, 
            {id: "tuesday", localDate: "2022-10-11"}, 
            {id: "wednesday", localDate: "2022-10-12"}, 
            {id: "thursday", localDate: "2022-10-13"}, 
            {id: "friday", localDate: "2022-10-14"}
        ],
        imageUrl: "https://devoxxian-image-thumbnails.s3-eu-west-1.amazonaws.com/profile-devoxxbe23-1a6e9b93-b9b9-4566-b013-7c9043243e0c.jpg",
        websiteUrl: "https://devoxx.be",
        location: { city: "Antwerp", country: "Belgium" },
        keywords: [ "Devoxx", "Java", "Kotlin", "Cloud", "Big data", "Web" ]
      } as EventInfo
    )

    const event = await crawlDevoxx("dvbe22")
    await saveEvent(event)
    info("Crawling done");
    return [{id: event.id}]
};

const saveEvent = async function(event: FullEvent) {
    info("saving event " + event.id)

    for (const daySchedule of event.daySchedules) {
        await db.collection("events").doc(event.id)
        .collection("days").doc(daySchedule.day)
            .set(daySchedule)
    }
       
    for (const talk of event.talks) {
        info("saving talk " + talk);
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