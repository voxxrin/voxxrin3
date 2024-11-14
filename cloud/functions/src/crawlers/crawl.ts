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
  DetailedTalk,
  Room, TalkAsset,
  TalkFormat,
  Track
} from "../../../../shared/daily-schedule.firestore";
import {ensureRoomsStatsFilledFor} from "../functions/firestore/services/stats-utils";
import {getEventOrganizerToken, getFamilyOrganizerToken} from "../functions/firestore/services/publicTokens-utils";
import {getCrawlersMatching} from "../functions/firestore/services/crawlers-utils";
import {ListableEvent} from "../../../../shared/event-list.firestore";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";
import {toValidFirebaseKey} from "../../../../shared/utilities/firebase.utils";
import { sanitize as domPurifySanitize } from "isomorphic-dompurify";
import { marked } from 'marked'
import {
  resolvedEventFirestorePath,
} from "../../../../shared/utilities/event-utils";

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
        .with("openplanner", async () => import("./openplanner/crawler"))
        .with("single-file", async () => import("./single-file/crawler"))
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
    crawlerIds?: string[]|undefined;
    crawlingToken?: string|undefined;
    dayIds?: string[]|undefined;
}

async function resolveCrawlerDescriptorsMatchingWithToken(crawlingToken: string) {
  const fbCrawlerDescriptors = await match(crawlingToken)
    .with(P.string.startsWith("familyOrganizer:"), async (familyOrganizerToken) => {
      const familyToken = await getFamilyOrganizerToken(familyOrganizerToken);
      return getCrawlersMatching(crawlersColl =>
        crawlersColl.where("eventFamily", "in", familyToken.eventFamilies)
      )
    }).with(P.string.startsWith("eventOrganizer:"), async (eventOrganizerToken) => {
      const eventToken = await getEventOrganizerToken(eventOrganizerToken);
      return getCrawlersMatching(crawlersColl =>
        crawlersColl.where("eventName", "in", eventToken.eventNames)
      )
    }).run()

  if(!fbCrawlerDescriptors.length) {
    throw new Error(`No crawler found matching [${crawlingToken}] token !`)
  }

  return fbCrawlerDescriptors;
}

const crawlAll = async function(criteria: CrawlCriteria) {
    if(!criteria.crawlingToken) {
        throw new Error(`Missing crawlingToken mandatory query parameter !`)
    }

    info("Starting crawling");
    const start = Date.now();

    const crawlerDescriptors = await resolveCrawlerDescriptorsMatchingWithToken(criteria.crawlingToken);

    const matchingCrawlerDescriptors = crawlerDescriptors.filter(firestoreCrawler => {
      const eventIdConstraintMatches = !criteria.crawlerIds
        || !criteria.crawlerIds.length
        || criteria.crawlerIds.includes(firestoreCrawler.id);

      return eventIdConstraintMatches;
    });

    if(!matchingCrawlerDescriptors.length) {
      throw new Error(`No crawler found matching crawlerIds=${JSON.stringify(criteria.crawlerIds)}`);
    }

    return await Promise.all(matchingCrawlerDescriptors.map(async crawlerDescriptor => {
        const eventId = crawlerDescriptor.eventId || crawlerDescriptor.id;
        try {
            const start = Temporal.Now.instant()

            const crawler = await resolveCrawler(crawlerDescriptor.kind);
            if(!crawler) {
                throw new Error(`Error: no crawler found for kind: ${crawlerDescriptor.kind} (with id=${eventId})`)
            }

            info(`crawling event ${eventId} of type [${crawlerDescriptor.kind}]...`)
            const crawlerDescriptorContent = await http.get(crawlerDescriptor.descriptorUrl)
            const crawlerKindDescriptor = crawler.descriptorParser.parse(crawlerDescriptorContent);

            const event = await crawler.crawlerImpl(eventId, crawlerKindDescriptor, { dayIds: criteria.dayIds });
            const messages = await sanityCheckEvent(event);

            await transformEventContent(event, [
              {
                name: "talks-regular",
                contentExtractor: (event) => event.talks.flatMap(talk => [
                  { get: () => talk.title, set: (content) => talk.title = content },
                  ...talk.tags.map((tag, idx) => ({ get: () => tag, set: (content: string) => talk.tags[idx] = content })),
                ]),
                transformations: [sanitize]
              }, {
                name: "talks-html",
                contentExtractor: (event) => event.talks.flatMap(talk => [
                  { get: () => talk.summary, set: (content) => talk.summary = content },
                  { get: () => talk.description, set: (content) => talk.description = content },
                ]),
                transformations: [
                  ...(event.conferenceDescriptor.formattings.parseMarkdownOn.includes("talk-summary")?[markdownToHtml]:[]),
                  sanitize
                ]
              }, {
                name: "speakers-regular",
                contentExtractor: (event) => event.talks.flatMap(talk =>
                  talk.speakers.flatMap(speaker => [
                    { get: () => speaker.fullName, set: (content: string) => speaker.fullName = content },
                    { get: () => speaker.companyName, set: (content: string) => speaker.companyName = content },
                  ])
                ),
                transformations: [sanitize]
              }, {
                name: "speakers-html",
                contentExtractor: (event) => event.talks.flatMap(talk =>
                  talk.speakers.flatMap(speaker => [
                    { get: () => speaker.bio, set: (content: string) => speaker.bio = content },
                  ])
                ),
                transformations: [
                  ...(event.conferenceDescriptor.formattings.parseMarkdownOn.includes("speaker-bio")?[markdownToHtml]:[]),
                  sanitize
                ]
              }
            ])
            await saveEvent(event, crawlerDescriptor)

            const end = Temporal.Now.instant()
            return {
                eventId,
                days: event.daySchedules.map(ds => ds.day),
                descriptorUrlUsed: crawlerDescriptor.descriptorUrl,
                durationInSeconds: start.until(end).total('seconds'),
                messages
            }
        } catch(e: any) {
          const baseMessage = `Error during crawler with id ${eventId}`;
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

  // Ensuring no "/" exists in important ids (talk id & day id)
  for(const detailedTalk of event.talks) {
    const validTalkId = toValidFirebaseKey(detailedTalk.id);
    if(validTalkId !== detailedTalk.id) {
      // updating talk id references...
      for(const daySchedule of event.daySchedules) {
        for(const timeslot of daySchedule.timeSlots) {
          if(timeslot.type === 'talks') {
            for(const talk of timeslot.talks) {
              if(talk.id === detailedTalk.id) {
                talk.id = validTalkId;
              }
            }
          }
        }
      }

      detailedTalk.id = validTalkId;
    }
  }
  for(const dailySchedule of event.daySchedules) {
    const validDayId = toValidFirebaseKey(dailySchedule.day);
    if(validDayId !== dailySchedule.day) {
      // updating day id references...
      for(const confDescriptorDay of event.conferenceDescriptor.days) {
        if(confDescriptorDay.id === dailySchedule.day) {
          confDescriptorDay.id = validDayId;
        }
      }

      dailySchedule.day = validDayId;
    }
  }

  return crawlingMessages;
}

const saveEvent = async function (event: FullEvent, crawlerDescriptor: z.infer<typeof FIREBASE_CRAWLER_DESCRIPTOR_PARSER>) {
    info("saving event " + event.id)

    const websiteUrl = (event.conferenceDescriptor.infos?.socialMedias || []).find(sm => sm.type === 'website')?.href || ""
    const baseListableEvent = {
      ...event.info,
      eventFamily: crawlerDescriptor.eventFamily,
      eventName: crawlerDescriptor.eventName,
      websiteUrl,
    } as const

    const [spaceToken, spaceContext, listableEvent]: [string|undefined, string, ListableEvent] =
      crawlerDescriptor.visibility === 'public'
        ? [undefined, 'public space', { ...baseListableEvent, visibility: 'public' }]
        : [crawlerDescriptor.spaceToken, `private space: ${crawlerDescriptor.spaceToken}`, {...baseListableEvent, visibility: 'private', spaceToken: crawlerDescriptor.spaceToken}]

    if(spaceToken) {
      const space = await db.doc(`/spaces/${spaceToken}`).get()
      // Creating (dummy) space entry so that we can list spaces serverside (we can't list ids from empty docs)
      if(!space.exists) {
        space.ref.set({ spaceToken });
      }
    }

    await db.doc(resolvedEventFirestorePath(event.id, spaceToken)).set(listableEvent)

    const talksStatsAllInOneDoc = await db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}/talksStats-allInOne/self`).get()
    if(!talksStatsAllInOneDoc.exists) {
        await db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}/talksStats-allInOne/self`).set({})
    }

    const firestoreEvent = db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}`);
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
                const dailyRating = await db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}/organizer-space/${organizerSecretToken}/daily-ratings/${daySchedule.day}`).get()
                if(!dailyRating.exists) {
                    await db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}/organizer-space/${organizerSecretToken}/daily-ratings/${daySchedule.day}`).set({});
                }
            }))

            return {organizerSecretToken, organizerSpaceContent};
        }).with(1, async () => {
            const organizerSecretToken = await organizerSpaceEntries[0].id;
            const organizerSpaceContent = (await firestoreEvent.collection('organizer-space').doc(organizerSecretToken).get()).data() as ConferenceOrganizerSpace;
            return {organizerSecretToken, organizerSpaceContent};
        }).otherwise(async () => {
            throw new Error(`More than 1 organizer-space entries detected (${organizerSpaceEntries.length}) for event ${event.id} (${spaceContext})`);
        })

    const talkFeedbacksDoc = await db.collection(`${resolvedEventFirestorePath(event.id, spaceToken)}/organizer-space/${organizerSecretToken}/ratings`).listDocuments()
    const ratingsTalkIds = talkFeedbacksDoc.map(doc => doc.id);
    await Promise.all([
        ...event.daySchedules.map(async daySchedule => {
          const dailyRatings = (await db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}/organizer-space/${organizerSecretToken}/daily-ratings/${daySchedule.day}`).get()).data() as Record<string, object>;
          const talkIds = daySchedule.timeSlots.flatMap(ts => ts.type === 'talks' ? ts.talks.map(t => t.id) : [])
          const dailyRatingsToUpdate = talkIds.reduce((dailyRatingsToUpdate, talkId) => {
            if(!dailyRatings[talkId]) {
              dailyRatingsToUpdate[talkId] = {};
            }
            return dailyRatingsToUpdate;
          }, {} as Record<string, object>)

          if(Object.keys(dailyRatingsToUpdate).length) {
            await db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}/organizer-space/${organizerSecretToken}/daily-ratings/${daySchedule.day}`).update(dailyRatingsToUpdate);
          }
        }),
        ...event.talks.map(async talk => {
          if(!ratingsTalkIds.includes(talk.id) && !talk.isOverflow) {
            await db.doc(`${resolvedEventFirestorePath(event.id, spaceToken)}/organizer-space/${organizerSecretToken}/ratings/${talk.id}`).create({})
          }
        })
    ])

    await Promise.all(event.daySchedules.map(async daySchedule => {
        try {
            await firestoreEvent
                .collection("days").doc(daySchedule.day)
                .set(daySchedule)
        }catch(e) {
            error(`Error while saving dailySchedule ${daySchedule.day}: ${e?.toString()}`)
        }
    }))

    const talksCollectionRefBeforeUpdate = (await db.collection(`/${resolvedEventFirestorePath(event.id, spaceToken)}/talks`).listDocuments()) || []
    const talkIdsHashBeforeUpdate = talksCollectionRefBeforeUpdate.map(talk => talk.id).sort().join(",")

    await Promise.all(event.talks.map(async talk => {
        // Skip storing overflow talk details as this is pointless...
        if(talk.isOverflow) {
          return;
        }
        try {
            info("saving talk " + talk.id + " " + talk.title);
            const talkRef = firestoreEvent.collection("talks").doc(talk.id)
            const talkDoc = await talkRef.get()
            const assets: TalkAsset[] = talkDoc.exists ? (talkDoc.data() as DetailedTalk).assets : []

            await talkRef.set({ ...talk, assets })

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
                    speakersFullNames: talk.speakers.map(sp => sp.fullName),
                    secretToken: talkFeedbackViewerSecretToken
                });
            }
        }catch(e) {
            error(`Error while saving talk ${talk.id}: ${e?.toString()}`)
        }
    }));

    const talksCollectionRefAfterUpdate = (await db.collection(`/${resolvedEventFirestorePath(event.id, spaceToken)}/talks`).listDocuments()) || []
    const talkIdsHashAfterUpdate = talksCollectionRefAfterUpdate.map(talk => talk.id).sort().join(",")

    if(talkIdsHashBeforeUpdate !== talkIdsHashAfterUpdate) {
        await eventLastUpdateRefreshed(spaceToken, event.id, ['talkListUpdated']);
    }

    try {
        // TODO: Remove me once watch later will be properly implemented !
        event.conferenceDescriptor.features.remindMeOnceVideosAreAvailableEnabled = false;

        const confDescriptor: ConferenceDescriptor = {
          ...listableEvent,
          ...event.conferenceDescriptor,
        }

        await firestoreEvent.collection('event-descriptor')
            .doc('self')
            .set(confDescriptor);

    }catch(e) {
        error(`Error while storing conference descriptor ${event.conferenceDescriptor.id} (${spaceContext}): ${e?.toString()}`)
    }

    try {
        await firestoreEvent.collection('organizer-space').doc(organizerSecretToken).set(organizerSpaceContent)
    }catch(e) {
        error(`Error while storing event's organizer-space content`)
    }

    await ensureRoomsStatsFilledFor(spaceToken, event.id)
}

type ContentTransformation = {
  name: string,
  contentExtractor: (fullEvent: FullEvent) => Array<{ get: () => string|null|undefined, set: (value: string) => void }>,
  transformations: Array<(content: string) => Promise<string>>
}

async function transformEventContent(fullEvent: FullEvent, contentTransformations: ContentTransformation[]): Promise<void> {
  for(const contentTransformation of contentTransformations) {
    for(const contentGetterSetter of contentTransformation.contentExtractor(fullEvent)) {
      const content = contentGetterSetter.get()
      if(content) {
        let updatedContent = content;
        for(const transformation of contentTransformation.transformations) {
          updatedContent = await transformation(updatedContent)
        }
        contentGetterSetter.set(updatedContent)
      }
    }
  }
}


async function sanitize(content: string): Promise<string> {
  return domPurifySanitize(content)
}

async function markdownToHtml(content: string): Promise<string> {
  return marked.parse(content);
}

export default crawlAll;
