import {db, info, error} from "../firebase"
import {DEVOXX_CRAWLER} from "./devoxx/crawler"
import { FullEvent } from "../models/Event";
import {z} from "zod";
import {LA_PRODUCT_CONF_CRAWLER} from "./la-product-conf/crawler";
import {FIREBASE_CRAWLER_DESCRIPTOR_PARSER} from "./crawler-parsers";
import {HexColor, ISODatetime} from "../../../../shared/type-utils";
import {WEB2DAY_CRAWLER} from "./web2day/crawler";
import {match} from "ts-pattern";
import {Temporal} from "@js-temporal/polyfill";
const axios = require('axios');

export type CrawlerKind<ZOD_TYPE extends z.ZodType> = {
    kind: string,
    crawlerImpl: (eventId: string, crawlerDescriptor: z.infer<ZOD_TYPE>, criteria: { dayIds?: string[]|undefined }) => Promise<FullEvent>,
    descriptorParser: ZOD_TYPE
}

const CRAWLERS: CrawlerKind<any>[] = [
    DEVOXX_CRAWLER,
    LA_PRODUCT_CONF_CRAWLER,
    WEB2DAY_CRAWLER
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

export type CrawlCriteria = {
    crawlingToken?: string|undefined;
    dayIds?: string[]|undefined;
}

const crawlAll = async function(criteria: CrawlCriteria) {
    if(!criteria.crawlingToken) {
        throw new Error(`Missing crawlingToken mandatory query parameter !`)
    }

    info("Starting crawling");
    const start = Date.now();

    const fbCrawlerDescriptorSnapshot = await db.collection("crawlers")
        .where("crawlingKeys", "array-contains", criteria.crawlingToken)
        .get();


    if (fbCrawlerDescriptorSnapshot.empty) {
        info(`No crawler found matching [${criteria.crawlingToken}] token !`)
        return;
    }

    const isAutoCrawling = criteria.crawlingToken.startsWith("auto:");
    const matchingCrawlerDescriptors = fbCrawlerDescriptorSnapshot.docs.map((snap, _) => {
        return {...FIREBASE_CRAWLER_DESCRIPTOR_PARSER.parse(snap.data()), id: snap.id }
    }).filter(firestoreCrawler => {
        return !isAutoCrawling
            || Temporal.Now.instant().epochMilliseconds < Date.parse(firestoreCrawler.stopAutoCrawlingAfter)
    });

    return await Promise.all(matchingCrawlerDescriptors.map(async crawlerDescriptor => {
        try {
            const start = Temporal.Now.instant()

            const crawler = CRAWLERS.find(c => c.kind === crawlerDescriptor.kind);
            if(!crawler) {
                error(`Error: no crawler found for kind: ${crawlerDescriptor.kind} (with id=${crawlerDescriptor.id})`)
                return;
            }

            info(`crawling event ${crawlerDescriptor.id} of type [${crawlerDescriptor.kind}]...`)
            const crawlerDescriptorContent = (await axios.get(crawlerDescriptor.descriptorUrl)).data
            const crawlerKindDescriptor = crawler.descriptorParser.parse(crawlerDescriptorContent);

            const event = await crawler.crawlerImpl(crawlerDescriptor.id, crawlerKindDescriptor, { dayIds: criteria.dayIds });
            await saveEvent(event)

            const end = Temporal.Now.instant()
            return {
                eventId: crawlerDescriptor.id,
                days: event.daySchedules.map(ds => ds.day),
                durationInSeconds: start.until(end).total('seconds')
            }
        }catch(e: any) {
            error(`Error during crawler with id ${crawlerDescriptor.id}: ${e?.toString()}`)
            throw e;
        }
    }))
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

    try {
        await firestoreEvent.collection('event-descriptor')
            .doc('self')
            .set(event.conferenceDescriptor);
    }catch(e) {
        error(`Error while storing conference descriptor ${event.conferenceDescriptor.id}: ${e?.toString()}`)
    }
}

export default crawlAll;
