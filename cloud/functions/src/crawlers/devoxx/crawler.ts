import {info} from "../../firebase";

import {CfpDetailedSpeaker, CfpEvent, DevoxxRoom, DevoxxScheduleItem, DevoxxScheduleProposal,} from "./types"
import {Break, SocialLink} from "../../../../../shared/daily-schedule.firestore"
import {FullEvent} from "../../models/Event";
import {ISODatetime, ISOLocalDate} from "../../../../../shared/type-utils";
import {Day} from "../../../../../shared/event-list.firestore";
import {Temporal} from "@js-temporal/polyfill";
import {z} from "zod";
import {EVENT_DESCRIPTOR_PARSER, INFOS_PARSER, THEMABLE_TALK_FORMAT_PARSER} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {match, P} from "ts-pattern";
import {http} from "../utils";
import {FullEventBuilder} from "../full-event.builder";

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export const DEVOXX_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    // All these fields can be extracted from the devoxx API
    title: true, description: true, days: true,
    timezone: true, location: true,
    // We're not putting tracks here even though we can get them from devoxx API
    // because we need a theme color for them that are currently *not* provided by the API
    rooms: true,
    // We also avoid basing our talkFormats colors on API's sessionType.cssColor because this
    // color might be used for different purpose than for Voxxrin (for example, for the website, or
    // for the backoffice scheduling app)
    // ... and at the same time, for backward compat crawler json config reasons, we don't want to
    // consider talkFormats field as being mandatory (that's why we're overriding talkFormat zod config:
    // we make this field optional)
    talkFormats: true,
}).extend({
    cfpId: z.string().nullish(),
    cfpBaseUrl: z.string().nullish(),
    eventFamily: z.string(),
    infos: INFOS_PARSER.extend({
        address: z.string().nullish(),
    }).omit({ floorPlans: true }).optional(),
    talkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER).default([]),
})

type DevoxxFloorPlan = {
    id: number,
    name: string,
    imageURL: string,
}

export const DEVOXX_CRAWLER: CrawlerKind<typeof DEVOXX_DESCRIPTOR_PARSER> = {
    descriptorParser: DEVOXX_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof DEVOXX_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }) => {
        const rawCfpBaseUrl = match([descriptor.cfpBaseUrl, descriptor.cfpId])
            .with([P.nonNullable, P._], ([cfpBaseUrl, _]) => cfpBaseUrl.substring(0, cfpBaseUrl.length - (cfpBaseUrl.endsWith("/")?1:0)))
            .with([P._, P.nonNullable], ([_, cfpId]) => `https://${cfpId}.cfp.dev`)
            .otherwise(() => `https://${eventId}.cfp.dev`)

        if(![`https://${eventId}.cfp.dev`, `http://${eventId}.cfp.dev`].includes(rawCfpBaseUrl)) {
          throw new Error(`Voxxrin event id (${eventId}) not matching with cfp.dev's slug (${rawCfpBaseUrl}).
This can lead to unexpected behaviour when CFP will try to call voxxrin API using slug as event id.
Please, unless event id is made configurable at cfp.dev level, you should rather use a voxxrin event id matching cfp.dev's slug !
`)
        }

        const fullEventBuilder = new FullEventBuilder(eventId);

        console.info(`Fetching CFP main infos...`)
        const cfpBaseUrl = rawCfpBaseUrl+"/";
        const [cfpEvent, cfpTalks, cfpFloorPlans, cfpRooms ] = await Promise.all([
            http.get<CfpEvent>(`${cfpBaseUrl}api/public/event`),
            http.get<DevoxxScheduleProposal[]>(`${cfpBaseUrl}api/public/talks?size=1000`),
            http.maybeGet<DevoxxFloorPlan[]>(`${cfpBaseUrl}api/public/floorplans`),
            http.get<DevoxxRoom[]>(`${cfpBaseUrl}api/public/rooms`),
        ])

        console.info(`Fetching speakers' details...`)
        await Promise.all(cfpTalks.flatMap(talk => talk.speakers).map(talkSpeaker =>
          http.get<CfpDetailedSpeaker>(`${cfpBaseUrl}api/public/speakers/${talkSpeaker.id}`).then(cfpDetailedSpeaker => {
            fullEventBuilder.addSpeaker({
              id: cfpDetailedSpeaker.id.toString(),
              fullName: talkSpeaker.fullName,
              companyName: cfpDetailedSpeaker.company,
              photoUrl: cfpDetailedSpeaker.imageUrl,
              bio: talkSpeaker.bio, // strangely, talkSpeaker.bio is better than cfpDetailedSpeaker.bio (we have less <p></p> in it)
              social: ([] as SocialLink[])
                .concat(cfpDetailedSpeaker.twitterHandle ? [ {type: "twitter", url: `https://twitter.com/${cfpDetailedSpeaker.twitterHandle}`} ]:[])
                .concat(cfpDetailedSpeaker.linkedInUsername ? [ {type: "linkedin", url: `https://linkedin.com/in/${cfpDetailedSpeaker.linkedInUsername}`} ]:[])
            });
          })
        ))

        console.info(`Filling tracks/formats/rooms in fullEventBuilder...`)
        descriptor.talkTracks.forEach(track => {
          fullEventBuilder.addThemedTrack(track);
        });
        descriptor.talkFormats.forEach(format => {
          fullEventBuilder.addThemedFormat(format);
        });
        descriptor.supportedTalkLanguages.forEach(lang => {
          fullEventBuilder.addThemedLanguage(lang);
        });
        (cfpRooms || []).forEach(room => {
          fullEventBuilder.addRoom({
            id: room.id.toString(),
            title: room.name,
          })
        });

        console.info(`Filling fullEvent's detailed talks`)
        cfpTalks.map(proposal => {
          // In case format was missing in descriptor
          fullEventBuilder.addFormat({
            id: proposal.sessionType.id.toString(),
            title: proposal.sessionType.name,
            duration: `PT${proposal.sessionType.duration}m`,
          }, { ignoreDuplicates: true });
          // In case track was missing in descriptor
          fullEventBuilder.addTrack({
            id: ""+proposal.track.id,
            title: proposal.track.name,
          }, { ignoreDuplicates: true });

          const upperFirstAudience = proposal.audienceLevel.charAt(0).toUpperCase() + proposal.audienceLevel.slice(1).toLowerCase();
          fullEventBuilder.addTalk({
            id: proposal.id.toString(),
            title: proposal.title,
            speakerIds: proposal.speakers.map(speaker => speaker.id.toString()),
            formatId: proposal.sessionType.id.toString(),
            trackId: proposal.track.id.toString(),
            language: proposal.language?.alpha2 || "en",
            // we can't know at this stage, if talk is an overflow one (this a timeslot-level information)
            // see fullEventBuilder.updateTalk() call later
            isOverflow: false,
            description: proposal.description || "",
            summary: proposal.summary || "",
            tags: [`Audience:${upperFirstAudience}`].concat((proposal.tags || []).map(t => t.name)),
            assets: [],
          });
        })

        const start = cfpEvent.fromDate.substring(0, 10) as ISOLocalDate
        const end = cfpEvent.toDate.substring(0, 10) as ISOLocalDate

        // collect days
        const days: Day[] = []
        for(let d:Temporal.PlainDate = Temporal.PlainDate.from(start); ; d = d.add({days: 1})) {
            days.push({id: daysOfWeek[d.dayOfWeek - 1], localDate: d.toString() as ISOLocalDate})
            if (d.toString() == end) {
                break;
            }
        }

        const daysMatchingCriteria = days.filter(d => {
            return !criteria.dayIds || !criteria.dayIds.length || criteria.dayIds.includes(d.id);
        })

        console.info(`Building daily schedules...`)
        const dailySchedulesResults = await Promise.all(daysMatchingCriteria.map(async day => {
          try {
            console.info(`[dayId=${day.id}] fetching schedule items...`)
            return {
              day: day.id,
              outcome: 'success' as const,
              schedules: await http.get<DevoxxScheduleItem[]>(`${cfpBaseUrl}api/public/schedules/${day.id}`)
            }
          } catch(error) {
            return {
              day: day.id,
              outcome: 'failure' as const,
              schedules: undefined
            }
          }
        }));

        const dayFailures = dailySchedulesResults.filter(result => result.outcome === 'failure');
        if(dayFailures.length) {
          const errorMessages = [
            `Error while fetching daily schedules:`,
            ...dayFailures.map(failure => `  ${failure.day}: GET ${cfpBaseUrl}api/public/schedules/${failure.day}`),
            ``,
            `Has schedule been published ?`,
          ];
          throw new Error(errorMessages.join("\n"));
        }

        const dailySchedules = dailySchedulesResults
          .map(result => result.outcome === 'success' ? { schedules: result.schedules, day: result.day } : undefined)
          .filter(schedule => schedule !== undefined)
          .map(dailySchedule => dailySchedule!);

        // const ongoingScheduleItems = new Set<string>();
        // const intervalId = setInterval(() => console.info(`ongoingScheduleItems: ${[...ongoingScheduleItems].join('\n')}`), 1000)

        const results = await Promise.all(dailySchedules.map(async dailySchedule => {
          try {
            const dailyScheduleItems = dailySchedule.schedules;

            console.info(`[dayId=${dailySchedule.day}] processing ${dailyScheduleItems.length} schedule items...`)
            for(const scheduleItem of dailyScheduleItems) {
              const scheduleItemHash = `${dailySchedule.day} -> ${scheduleItem.id}`
              // ongoingScheduleItems.add(scheduleItemHash)

              match(scheduleItem)
                .with({ sessionType: { pause: true }}, pauseItem => {
                  const icon = match<string, Break['icon']>(pauseItem.sessionType.name.toLowerCase())
                    .when(sessionTypeName => sessionTypeName.includes('meet') || sessionTypeName.includes('greet'), () => 'beer')
                    .when(sessionTypeName => sessionTypeName.includes('movie'), () => 'movie')
                    .when(sessionTypeName => sessionTypeName.includes('lunch'), () => 'restaurant')
                    .when(sessionTypeName => sessionTypeName.includes('registration'), () => 'ticket')
                    .when(sessionTypeName => sessionTypeName.includes('travel'), () => 'wallet')
                    .when(sessionTypeName => sessionTypeName.includes('coffee'), () => 'cafe')
                    .otherwise(() => 'cafe')

                  fullEventBuilder.addBreak({
                    start: pauseItem.fromDate as ISODatetime,
                    duration: Temporal.Duration.from({ minutes: pauseItem.sessionType.duration }),
                    title: pauseItem.sessionType.name,
                    roomId: pauseItem.room.id.toString(),
                    icon,
                  })
                })
                .with({ proposal: P.not(P.nullish) }, talkItem => {
                  const talkId = talkItem.proposal.id.toString()
                  fullEventBuilder.allocateTalk({
                    talkId,
                    start: talkItem.fromDate as ISODatetime,
                    maybeRoomId: talkItem.room.id.toString(),
                  })

                  if(talkItem.overflow) {
                    fullEventBuilder.updateTalk(talkId, ({simpleTalk, detailedTalk}) => {
                      simpleTalk.isOverflow = true;
                      detailedTalk.isOverflow = true;
                    })
                  }
                }).otherwise(slotWithoutProposal => {
                  if(slotWithoutProposal.overflow) {
                    // OVERFLOWS handling...
                    // Looking for non-overflow result to copy (most of) its properties
                    const nonOverflowTalks = dailyScheduleItems
                      .filter(item =>
                         // Looking for non-overflow slot at the same timeslot
                         !item.overflow
                         && item.proposal
                         && Temporal.Instant.from(item.fromDate).toString() === Temporal.Instant.from(slotWithoutProposal.fromDate).toString()
                         && Temporal.Instant.from(item.toDate).toString() === Temporal.Instant.from(slotWithoutProposal.toDate).toString()
                      )
                    if(nonOverflowTalks.length !== 1) {
                      console.warn(`WARNING: found ${nonOverflowTalks.length} non-overflow talks on ${slotWithoutProposal.fromDate}--${slotWithoutProposal.toDate} timeslot for an overflow talk`)
                      // No-op
                    } else {
                      const nonOverflowProposal = nonOverflowTalks[0].proposal!;
                      fullEventBuilder.allocateOverflowForTalk({
                        talkId: nonOverflowProposal.id.toString(),
                        start: slotWithoutProposal.fromDate as ISODatetime,
                        inRoomId: slotWithoutProposal.room.id.toString(),
                      })
                    }
                  } else {
                    // Ignoring slot ???
                    info(`Ignoring slot with id ${slotWithoutProposal.id} (on day=${dailySchedule.day}) as it has no proposal nor is a pause !`);
                  }
                });

              // ongoingScheduleItems.delete(scheduleItemHash);
            }

            console.info(`[dayId=${dailySchedule.day}] ${dailyScheduleItems.length} schedule items processed !`)
          } catch(err) {
            console.error(`[dayId=${dailySchedule.day}] Error occured: ${err}`);
          }
        }))

      // clearInterval(intervalId);
      // console.info(results)

      console.info(`Building event info...`)
      const eventInfo: FullEvent['listableEventInfo'] = {
            id: eventId,
            title: cfpEvent.name,
            description: cfpEvent.description,
            peopleDescription: descriptor.peopleDescription,
            buyTicketsUrl: descriptor.buyTicketsUrl || null,
            timezone: cfpEvent.timezone,
            days: days,
            logoUrl: descriptor.logoUrl,
            backgroundUrl: descriptor.backgroundUrl,
            location: {
                city: cfpEvent.locationCity, country: cfpEvent.locationCountry,
                coords: {
                    latitude: cfpEvent.venueLatitude,
                    longitude: cfpEvent.venueLongitude
                },
                ...(descriptor.infos?.address ? {address: descriptor.infos.address} : {}),
            },
            theming: descriptor.theming,
            keywords: descriptor.keywords
        }

        fullEventBuilder.usingInfosAndDescriptor(eventInfo, {
          headingTitle: descriptor.headingTitle,
          headingSubTitle: descriptor.headingSubTitle,headingBackground: descriptor.headingBackground,
          features: {
            ...descriptor.features,
          },
          infos: {
            floorPlans: (cfpFloorPlans || []).map(cfpFloorPlan => ({
              label: cfpFloorPlan.name,
              pictureUrl: cfpFloorPlan.imageURL
            })),
            socialMedias: descriptor.infos?.socialMedias || [],
            sponsors: descriptor.infos?.sponsors || []
          },
          formattings: descriptor.formattings || {
            talkFormatTitle: 'with-duration',
            parseMarkdownOn: [],
          },
        });

        console.info(`Generating fullEvent...`)
        const fullEvent = fullEventBuilder.createFullEvent();
        console.info(`FullEvent generated !`)
        return fullEvent;
    }
};

export default DEVOXX_CRAWLER;
