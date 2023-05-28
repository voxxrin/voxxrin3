import {db, info, error} from "../firebase"
import {DEVOXX_CRAWLER} from "./devoxx/crawler"
import { FullEvent } from "../models/Event";
import {z} from "zod";
import {LA_PRODUCT_CONF_CRAWLER} from "./la-product-conf/crawler";
import {FIREBASE_CRAWLER_DESCRIPTOR_PARSER} from "./crawler-parsers";
import {HexColor} from "../../../../shared/type-utils";
const axios = require('axios');

export type CrawlerKind<ZOD_TYPE extends z.ZodType> = {
    kind: string,
    crawlerImpl: (eventId: string, crawlerDescriptor: z.infer<ZOD_TYPE>) => Promise<FullEvent>,
    descriptorParser: ZOD_TYPE
}

const CRAWLERS: CrawlerKind<any>[] = [
    DEVOXX_CRAWLER,
    LA_PRODUCT_CONF_CRAWLER,
]

export const TALK_FORMAT_FALLBACK_COLORS: HexColor[] = [
    "#165CE3", "#EA7872", "#935A59", "#3EDDEF",
    "#69BE72", "#DA8DE0", "#7D51FB", "#199F8F",
    "#D6B304", "#C21146"
];
export const TALK_TRACK_FALLBACK_COLORS: HexColor[] = [
    "#165CE3", "#EA7872", "#935A59", "#3EDDEF",
    "#69BE72", "#DA8DE0", "#7D51FB", "#199F8F",
    "#D6B304", "#C21146"
];
export const LANGUAGE_FALLBACK_COLORS: HexColor[] = [
    "#165CE3"
];

const crawlAll = async function() {
    info("Starting crawling");
    const start = Date.now();

    const events: Array<{id: string}> = []

    const fbCrawlerDescriptorSnapshot = await db.collection("crawlers")
        .where("crawl", "==", true)
        .get();
    if (fbCrawlerDescriptorSnapshot.empty) {
        info("no events to crawl")
    } else {
        await Promise.all(fbCrawlerDescriptorSnapshot.docs.map(async doc => {
            try {
                const firebaseCrawlerDescriptor = FIREBASE_CRAWLER_DESCRIPTOR_PARSER.parse(doc.data());
                const crawler = CRAWLERS.find(c => c.kind === firebaseCrawlerDescriptor.kind);
                if(!crawler) {
                    error(`Error: no crawler found for kind: ${firebaseCrawlerDescriptor.kind} (with id=${doc.id})`)
                    return;
                }

                info(`crawling event ${doc.id} of type [${firebaseCrawlerDescriptor.kind}]...`)
                const crawlerDescriptorContent = (await axios.get(firebaseCrawlerDescriptor.descriptorUrl)).data
                const crawlerKindDescriptor = crawler.descriptorParser.parse(crawlerDescriptorContent);

                const event = await crawler.crawlerImpl(doc.id, crawlerKindDescriptor);
                await saveEvent(event)
                events.push({id: event.id})
            }catch(e: any) {
                error(`Error during crawler with id ${doc.id}: ${e?.toString()}`)
            }
        }))
    }

    const end = Date.now();
    info(`Crawling done in ${(end-start)/1000}s`);
    return events
};

const saveEvent = async function(event: FullEvent) {
    info("saving event " + event.id)

    await db.collection("events").doc(event.id).set(event.info)

    const firestoreEvent = await db.collection("events").doc(event.id);
    await Promise.all(event.daySchedules.map(async daySchedule => {
        try {
            await firestoreEvent
                .collection("days").doc(daySchedule.day)
                .set(daySchedule)
        }catch(e) {
            error(`Error while saving dailySchedule ${daySchedule.day}: ${e?.toString()}`)
        }
    }))
    await Promise.all(event.talks.map(async talk => {
        try {
            info("saving talk " + talk.id + " " + talk.title);
            await firestoreEvent
                .collection("talks").doc(talk.id)
                .set(talk)
        }catch(e) {
            error(`Error while saving talk ${talk.id}: ${e?.toString()}`)
        }
    }));
    await Promise.all(
        event.talkStats
            .flatMap(dailyTalksStat =>
                dailyTalksStat.stats.map(stat => ({day: dailyTalksStat.day, stat: stat }))
            ).map(async talkStatWithDay => {
                try {
                    // TODO: see if we really want to override stats each time we crawl
                    await firestoreEvent
                        .collection("days").doc(talkStatWithDay.day)
                        .collection("talksStats").doc(talkStatWithDay.stat.id)
                        .set(talkStatWithDay.stat)
                }catch(e) {
                    error(`Error while storing talk stats with day ${talkStatWithDay.day}: ${e?.toString()}`)
                }
        })
    )

    try {
        await firestoreEvent.collection('event-descriptor')
            .doc('self')
            .set(event.conferenceDescriptor);
    }catch(e) {
        error(`Error while storing conference descriptor ${event.conferenceDescriptor.id}: ${e?.toString()}`)
    }
}

export default crawlAll;
