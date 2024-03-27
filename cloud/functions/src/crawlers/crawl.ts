import {db, info, error} from "../firebase"
import { FullEvent } from "../models/Event";
import {z} from "zod";
import {FIREBASE_CRAWLER_DESCRIPTOR_PARSER} from "./crawler-parsers";
import {HexColor} from "../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {match, P} from "ts-pattern";
import {v4 as uuidv4} from "uuid"
import {ConferenceOrganizerSpace} from "../../../../shared/conference-organizer-space.firestore";
import {eventLastUpdateRefreshed} from "../functions/firestore/firestore-utils";
import {http} from "./utils";
import {
  Room,
  TalkFormat,
  Track
} from "../../../../shared/daily-schedule.firestore";

export type CrawlerKind<ZOD_TYPE extends z.ZodType> = {
    crawlerImpl: (eventId: string, crawlerDescriptor: z.infer<ZOD_TYPE>, criteria: { dayIds?: string[]|undefined }) => Promise<FullEvent>,
    descriptorParser: ZOD_TYPE
}

async function resolveCrawler(kind: string): Promise<CrawlerKind<any>|undefined> {
    const crawler = await match(kind)
        .with("devoxx", async () => import("./devoxx/crawler"))
        .with("devoxx-scala", async () => import("./devoxx-scala/crawler"))
        .with("la-product-conf", async () => import("./la-product-conf/crawler"))
        .with("web2day", async () => import("./web2day/crawler"))
        .with("camping-des-speakers", async () => import("./camping-des-speakers/crawler"))
        .with("jugsummercamp", async () => import("./jugsummercamp/crawler"))
        .with("bdxio", async () => import("./bdxio/crawler"))
        .with("codeurs-en-seine", async () => import("./codeurs-en-seine/crawler"))
        .run()

    if(!crawler) {
        return undefined;
    }

    return crawler.default;
}

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
    eventIds?: string[]|undefined;
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
        throw new Error(`No crawler found matching [${criteria.crawlingToken}] token !`)
        return;
    }

    const isAutoCrawling = criteria.crawlingToken.startsWith("auto:");
    const matchingCrawlerDescriptors = fbCrawlerDescriptorSnapshot.docs.map((snap, _) => {
        return {...FIREBASE_CRAWLER_DESCRIPTOR_PARSER.parse(snap.data()), id: snap.id }
    }).filter(firestoreCrawler => {
        const dateConstraintMatches = isAutoCrawling
            || Temporal.Now.instant().epochMilliseconds < Date.parse(firestoreCrawler.stopAutoCrawlingAfter)

        const eventIdConstraintMatches = !criteria.eventIds || !criteria.eventIds.length || criteria.eventIds.includes(firestoreCrawler.id);

        return dateConstraintMatches && eventIdConstraintMatches;
    });

    if(!matchingCrawlerDescriptors.length) {
        throw new Error(`No crawler found matching either eventIds=${JSON.stringify(criteria.eventIds)} or crawlers' 'stopAutoCrawlingAfter' deadline`);
        return;
    }

    return await Promise.all(matchingCrawlerDescriptors.map(async crawlerDescriptor => {
        try {
            const start = Temporal.Now.instant()

            const crawler = await resolveCrawler(crawlerDescriptor.kind);
            if(!crawler) {
                throw new Error(`Error: no crawler found for kind: ${crawlerDescriptor.kind} (with id=${crawlerDescriptor.id})`)
                return;
            }

            info(`crawling event ${crawlerDescriptor.id} of type [${crawlerDescriptor.kind}]...`)
            const crawlerDescriptorContent = await http.get(crawlerDescriptor.descriptorUrl)
            const crawlerKindDescriptor = crawler.descriptorParser.parse(crawlerDescriptorContent);

            const event = await crawler.crawlerImpl(crawlerDescriptor.id, crawlerKindDescriptor, { dayIds: criteria.dayIds });
            const messages = sanityCheckEvent(event);
            await saveEvent(event)

            const end = Temporal.Now.instant()
            return {
                eventId: crawlerDescriptor.id,
                days: event.daySchedules.map(ds => ds.day),
                descriptorUrlUsed: crawlerDescriptor.descriptorUrl,
                durationInSeconds: start.until(end).total('seconds'),
                messages
            }
        }catch(e: any) {
          const baseMessage = `Error during crawler with id ${crawlerDescriptor.id}`;
          // const err = Error("")
          // err.
          const errMessage = match(e).with(P.instanceOf(Error), (err) => {
            return `${baseMessage}\nStack: ${err.stack}`;
          }).otherwise(() => {
            return baseMessage;
          })

          console.error(errMessage);
          throw new Error(errMessage);
        }
    }))
};

function sanityCheckEvent(event: FullEvent): string[] {

  const descriptorTrackIds = event.conferenceDescriptor.talkTracks.map(t => t.id);
  const descriptorFormatIds = event.conferenceDescriptor.talkFormats.map(f => f.id);
  const descriptorRoomIds = event.conferenceDescriptor.rooms.map(r => r.id);

  const talkLangs = new Set<string>()
  const unknownValues = event.talks.reduce((unknownValues, talk) => {
    if(!descriptorTrackIds.includes(talk.track.id)) {
      unknownValues.unknownTracks.set(talk.track.id, talk.track);
    }
    if(!descriptorFormatIds.includes(talk.format.id)) {
      unknownValues.unknownFormats.set(talk.format.id, talk.format);
    }
    if(!descriptorRoomIds.includes(talk.room.id)) {
      unknownValues.unknownRooms.set(talk.room.id, talk.room);
    }
    talkLangs.add(talk.language);

    return unknownValues
  }, { unknownTracks: new Map<string, Track>(), unknownFormats: new Map<string, TalkFormat>, unknownRooms: new Map<string, Room>() });

  const crawlingMessages: string[] = [];
  if(unknownValues.unknownTracks.size) {
    crawlingMessages.push(`WARNING: Some tracks have not been declared in crawler configuration: ${Array.from(unknownValues.unknownTracks.keys()).join(", ")}. Those tracks' title/color will be auto-guessed.`)
    event.conferenceDescriptor.talkTracks.push(...Array.from(unknownValues.unknownTracks.values()).map((track, index) => {
      return {
        id: track.id, title: track.title,
        themeColor: TALK_TRACK_FALLBACK_COLORS[index % TALK_TRACK_FALLBACK_COLORS.length]
      }
    }))
  }
  if(unknownValues.unknownFormats.size) {
    crawlingMessages.push(`WARNING: Some talk formats have not been declared in crawler configuration: ${Array.from(unknownValues.unknownFormats.keys()).join(", ")}. Those formats' title/color/duration will be auto-guessed.`)
    event.conferenceDescriptor.talkFormats.push(...Array.from(unknownValues.unknownFormats.values()).map((format, index) => {
      return {
        id: format.id, title: format.title, duration: format.duration,
        themeColor: TALK_FORMAT_FALLBACK_COLORS[index % TALK_FORMAT_FALLBACK_COLORS.length]
      }
    }))
  }
  if(unknownValues.unknownRooms.size) {
    crawlingMessages.push(`WARNING: Some rooms have not been declared in crawler configuration: ${Array.from(unknownValues.unknownRooms.keys()).join(", ")}. Those rooms' title will be auto-guessed.`)
    event.conferenceDescriptor.rooms.push(...Array.from(unknownValues.unknownRooms.values()).map((room, index) => {
      return {
        id: room.id, title: room.title,
      }
    }))
  }

  if(talkLangs.size === 1 && !event.conferenceDescriptor.features.hideLanguages.includes(Array.from(talkLangs)[0])) {
    event.conferenceDescriptor.features.hideLanguages.push(Array.from(talkLangs)[0]);
  }

  return crawlingMessages;
}

const saveEvent = async function(event: FullEvent) {
    info("saving event " + event.id)

    await db.collection("events").doc(event.id).set(event.info)

    const talksStatsAllInOneDoc = await db.doc(`events/${event.id}/talksStats-allInOne/self`).get()
    if(!talksStatsAllInOneDoc.exists) {
        await db.doc(`events/${event.id}/talksStats-allInOne/self`).set({})
    }

    const firestoreEvent = db.collection("events").doc(event.id);
    const organizerSpaceEntries = await firestoreEvent
        .collection('organizer-space')
        .listDocuments();

    const { organizerSpaceContent, organizerSecretToken }  = await match(organizerSpaceEntries.length)
        .with(0, async () => {
            const organizerSecretToken = uuidv4();
            const organizerSpaceContent: ConferenceOrganizerSpace = {
                organizerSecretToken,
                talkFeedbackViewerTokens: []
            }

            await firestoreEvent.collection('organizer-space').doc(organizerSecretToken).set(organizerSpaceContent)

            await Promise.all(event.daySchedules.map(async daySchedule => {
                const dailyRating = await db.doc(`events/${event.id}/organizer-space/${organizerSecretToken}/daily-ratings/${daySchedule.day}`).get()
                if(!dailyRating.exists) {
                    await db.doc(`events/${event.id}/organizer-space/${organizerSecretToken}/daily-ratings/${daySchedule.day}`).set({});
                }
            }))

            await Promise.all([
                ...event.talks.map(async talk => {
                    const talkFeedbacksDoc = db.doc(`events/${event.id}/organizer-space/${organizerSecretToken}/ratings/${talk.id}`)
                    const talkFeedbacks = await talkFeedbacksDoc.get();
                    if(!talkFeedbacks.exists) {
                        await talkFeedbacksDoc.create({});
                    }
                })
            ])
            return {organizerSecretToken, organizerSpaceContent};
        }).with(1, async () => {
            const organizerSecretToken = await organizerSpaceEntries[0].id;
            const organizerSpaceContent = (await firestoreEvent.collection('organizer-space').doc(organizerSecretToken).get()).data() as ConferenceOrganizerSpace;
            return {organizerSecretToken, organizerSpaceContent};
        }).otherwise(async () => {
            throw new Error(`More than 1 organizer-space entries detected (${organizerSpaceEntries.length}) for event ${event.id}`);
        })

    await Promise.all(event.daySchedules.map(async daySchedule => {
        try {
            await firestoreEvent
                .collection("days").doc(daySchedule.day)
                .set(daySchedule)
        }catch(e) {
            error(`Error while saving dailySchedule ${daySchedule.day}: ${e?.toString()}`)
        }
    }))

    const talksCollectionRefBeforeUpdate = (await db.collection(`/events/${event.id}/talks`).listDocuments()) || []
    const talkIdsHashBeforeUpdate = talksCollectionRefBeforeUpdate.map(talk => talk.id).sort().join(",")

    await Promise.all(event.talks.map(async talk => {
        try {
            info("saving talk " + talk.id + " " + talk.title);
            await firestoreEvent
                .collection("talks").doc(talk.id)
                .set(talk)

            const existingTalkFeedbackViewerToken = organizerSpaceContent.talkFeedbackViewerTokens
                .find(tfvt => tfvt.eventId === event.id && tfvt.talkId === talk.id)

            // If token already exists for the talk, let's not add it
            if(!existingTalkFeedbackViewerToken) {
                const talkFeedbackViewerSecretToken = uuidv4();

                await firestoreEvent
                    .collection("talks").doc(talk.id)
                    .collection("feedbacks-access").doc(talkFeedbackViewerSecretToken)
                    // Creating a fake entry so that feedbacks-access/{secretToken} node is created
                    .collection('_empty').add({ _: 42 })

                organizerSpaceContent.talkFeedbackViewerTokens.push({
                    eventId: event.id,
                    talkId: talk.id,
                    secretToken: talkFeedbackViewerSecretToken
                });
            }
        }catch(e) {
            error(`Error while saving talk ${talk.id}: ${e?.toString()}`)
        }
    }));

    const talksCollectionRefAfterUpdate = (await db.collection(`/events/${event.id}/talks`).listDocuments()) || []
    const talkIdsHashAfterUpdate = talksCollectionRefAfterUpdate.map(talk => talk.id).sort().join(",")

    if(talkIdsHashBeforeUpdate !== talkIdsHashAfterUpdate) {
        await eventLastUpdateRefreshed(event.id, ['talkListUpdated']);
    }

    try {
        // TODO: Remove me once watch later will be properly implemented !
        event.conferenceDescriptor.features.remindMeOnceVideosAreAvailableEnabled = false;

        await firestoreEvent.collection('event-descriptor')
            .doc('self')
            .set(event.conferenceDescriptor);
    }catch(e) {
        error(`Error while storing conference descriptor ${event.conferenceDescriptor.id}: ${e?.toString()}`)
    }

    try {
        await firestoreEvent.collection('organizer-space').doc(organizerSecretToken).set(organizerSpaceContent)
    }catch(e) {
        error(`Error while storing event's organizer-space content`)
    }
}

export default crawlAll;
