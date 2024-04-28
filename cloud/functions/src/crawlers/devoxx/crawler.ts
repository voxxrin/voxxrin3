import {debug, info} from "../../firebase";

import {
    CfpEvent,
    DevoxxScheduleItem,
    DevoxxScheduleSpeakerInfo
} from "./types"
import {
  Break,
  DailySchedule,
  DetailedTalk, Room,
  Speaker,
  Talk
} from "../../../../../shared/daily-schedule.firestore"
import { FullEvent } from "../../models/Event";
import { ISODatetime, ISOLocalDate } from "../../../../../shared/type-utils";
import { Day, ListableEvent } from "../../../../../shared/event-list.firestore";
import { Temporal } from "@js-temporal/polyfill";
import {z} from "zod";
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {
  EVENT_DESCRIPTOR_PARSER,
  INFOS_PARSER,
  THEMABLE_TALK_FORMAT_PARSER
} from "../crawler-parsers";
import {CrawlerKind, TALK_FORMAT_FALLBACK_COLORS} from "../crawl";
import {match} from "ts-pattern";
import {http} from "../utils";
import {TalkStats} from "../../../../../shared/event-stats";

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
    talkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER).optional(),
})

type DevoxxFloorPlan = {
    id: number,
    name: string,
    imageURL: string,
}

export const DEVOXX_CRAWLER: CrawlerKind<typeof DEVOXX_DESCRIPTOR_PARSER> = {
    descriptorParser: DEVOXX_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof DEVOXX_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }) => {
        const rawCfpBaseUrl = descriptor.cfpBaseUrl || `https://${descriptor.cfpId}.cfp.dev`;
        const cfpBaseUrl = rawCfpBaseUrl+(rawCfpBaseUrl.endsWith("/")?"":"/")
        const [cfpEvent, cfpFloorPlans] = await Promise.all([
            http.get<CfpEvent>(`${cfpBaseUrl}api/public/event`),
            http.maybeGet<DevoxxFloorPlan[]>(`${cfpBaseUrl}api/public/floorplans`),
        ])

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

        const eventInfo: FullEvent['info'] = {
            id: eventId,
            title: cfpEvent.name,
            description: cfpEvent.description,
            peopleDescription: descriptor.peopleDescription,
            timezone: cfpEvent.timezone,
            days: days,
            logoUrl: descriptor.logoUrl,
            backgroundUrl: descriptor.backgroundUrl,
            websiteUrl: cfpEvent.website,
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

        const eventTalks: DetailedTalk[] = [],
            daySchedules: DailySchedule[] = [],
            eventRooms: ConferenceDescriptor['rooms'] = [],
            eventTalkFormats: ConferenceDescriptor['talkFormats'] = [];
        await Promise.all(daysMatchingCriteria.map(async day => {
            const {daySchedule, talkStats, talks, rooms, talkFormats} = await crawlDevoxxDay(cfpBaseUrl, day.id, descriptor)
            daySchedules.push(daySchedule)
            for (const talk of talks) {
                eventTalks.push(talk)
            }
            rooms.forEach(r => {
                if(!eventRooms.find(er => er.id === r.id)) {
                    eventRooms.push(r);
                }
            })
            talkFormats.forEach(tf => {
                if(!eventTalkFormats.find(etf => etf.id === tf.id)) {
                    eventTalkFormats.push(tf);
                }
            })
        }))

        const eventDescriptor: FullEvent['conferenceDescriptor'] = {
            ...eventInfo,
            headingTitle: descriptor.headingTitle,
            features: descriptor.features,
            talkFormats: eventTalkFormats,
            talkTracks: descriptor.talkTracks,
            supportedTalkLanguages: descriptor.supportedTalkLanguages,
            rooms: eventRooms,
            infos: {
                floorPlans: (cfpFloorPlans || []).map(cfpFloorPlan => ({
                    label: cfpFloorPlan.name,
                    pictureUrl: cfpFloorPlan.imageURL
                })),
                socialMedias: descriptor.infos?.socialMedias || [],
                sponsors: descriptor.infos?.sponsors || []
            },
        }

        const event: FullEvent = {
            id: eventId, info: eventInfo, daySchedules,
            talks: eventTalks, conferenceDescriptor: eventDescriptor
        }
        return event
    }
};

type ScheduleTalkResult =
  { type: 'no-proposal', talk: undefined, detailedTalk: undefined, totalFavourites: undefined }
  | { type: 'overflow', start: ISODatetime, end: ISODatetime, room: Room }
  | { type: 'proposal', talk: Talk, detailedTalk: DetailedTalk, totalFavourites: number|undefined };
function toScheduleTalk(item: DevoxxScheduleItem, start: ISODatetime, end: ISODatetime, rooms: ConferenceDescriptor['rooms'], talkFormats: ConferenceDescriptor['talkFormats']): ScheduleTalkResult {
  if(!rooms.find(r => r.id === item.room.id.toString())) {
    rooms.push({ id: item.room.id.toString(), title: item.room.name });
  }
  if(!talkFormats.find(tf => tf.id === item.sessionType.id.toString())) {
    talkFormats.push({
      id: item.sessionType.id.toString(),
      title: item.sessionType.name,
      duration: `PT${item.sessionType.duration}m`,
      themeColor: TALK_FORMAT_FALLBACK_COLORS[talkFormats.length % TALK_FORMAT_FALLBACK_COLORS.length]
    });
  }

  const room: Room = {
    id: item.room.id.toString(),
    title: item.room.name
  }

  if(item.overflow) {
    return {
      type: 'overflow',
      start: start as ISODatetime,
      end: end as ISODatetime,
      room
    }
  }

  if(!item.proposal) {
    return { type: 'no-proposal', talk:undefined, detailedTalk: undefined, totalFavourites: undefined };
  }

  const talk: Talk = {
    id: item.proposal.id.toString(),
    title: item.proposal.title,
    speakers: item.proposal.speakers.map((s:DevoxxScheduleSpeakerInfo) => {
      const speaker: Speaker = {
        id: s.id.toString(),
        fullName: s.fullName,
        companyName: s.company,
        photoUrl: s.imageUrl,
        bio: s.bio,
        social: s.twitterHandle?[{type: "twitter", url: `https://twitter.com/${s.twitterHandle}`}]:[]
      }
      return speaker;
    }),
    room,
    format: {
      id: item.sessionType.id.toString(),
      title: item.sessionType.name,
      duration: `PT${item.sessionType.duration}m`
    },
    track: {
      id: item.proposal.track.id.toString(),
      title: item.proposal.track.name
    },
    language: item.proposal.language?.alpha2 || "en",
    isOverflow: false
  };

  const upperFirstAudience = item.proposal.audienceLevel.charAt(0).toUpperCase() + item.proposal.audienceLevel.slice(1).toLowerCase();
  const detailedTalk: DetailedTalk = {
    ...talk,
    start: start as ISODatetime,
    end: end as ISODatetime,
    summary: item.proposal.summary || "",
    description: item.proposal.description || "",
    tags: [`Audience:${upperFirstAudience}`].concat(item.proposal.tags.map(t => t.name)),
    assets: []
  };

  return { type: 'proposal', talk, detailedTalk, totalFavourites: item.totalFavourites };
}

const crawlDevoxxDay = async (cfpBaseUrl: string, day: string, descriptor: z.infer<typeof DEVOXX_DESCRIPTOR_PARSER>) => {
    const schedules = await http.get<DevoxxScheduleItem[]>(`${cfpBaseUrl}api/public/schedules/${day}`)

    const daySchedule: DailySchedule = {
        day: day,
        timeSlots: []
    }

    const talkStats: TalkStats[] = []

    const detailedTalks: DetailedTalk[] = []

    const rooms: ConferenceDescriptor['rooms'] = [];
    const talkFormats = descriptor.talkFormats || [];

    const slots = schedules.reduce((slots, item) => {
      const key = `${item.fromDate}--${item.toDate}`
      slots[key] = slots[key] || [];
      slots[key].push(item);
      return slots;
    }, {} as Record<string, DevoxxScheduleItem[]>)

    debug(`Devoxx slots for day ${day}: ${JSON.stringify(slots)}`)

    for(const [key, items] of Object.entries(slots)) {
        const [start, end] = key.split("--")

        info(key + "\n-------------------\n  - " + items.map((schedule:DevoxxScheduleItem, itemIndex) => {
            let title = schedule.proposal?.title || schedule.sessionType?.name
            if(!title) {
              throw Error(`Error while retrieving schedule item title for id ${schedule.id} (day=${day}, slot=${key}, itemIndex=${itemIndex})`);
            }
            return `${schedule.id} - ${schedule.room.name} - ${title}`
        }).join("\n  -") + "\n------------------");

        if (items.every((item: DevoxxScheduleItem) => { return item.sessionType.pause })) {
            const icon = match<string, Break['icon']>(items[0].sessionType.name.toLowerCase())
                .when(sessionTypeName => sessionTypeName.includes('meet') || sessionTypeName.includes('greet'), () => 'beer')
                .when(sessionTypeName => sessionTypeName.includes('movie'), () => 'movie')
                .when(sessionTypeName => sessionTypeName.includes('lunch'), () => 'restaurant')
                .when(sessionTypeName => sessionTypeName.includes('registration'), () => 'ticket')
                .when(sessionTypeName => sessionTypeName.includes('travel'), () => 'wallet')
                .when(sessionTypeName => sessionTypeName.includes('coffee'), () => 'cafe')
                .otherwise(() => 'cafe')
            daySchedule.timeSlots.push({
                id: key as any,
                start: start as ISODatetime,
                end: end as ISODatetime,
                type: "break",
                break: {
                    title: items[0].sessionType.name,
                    room: {
                        id: items[0].room.id.toString(),
                        title: items[0].room.name
                    },
                    icon
                }
            }
            )
        } else {
            const scheduleTalkResults = items.map(item => toScheduleTalk(item, start as ISODatetime, end as ISODatetime, rooms, talkFormats))
            const talks = scheduleTalkResults.reduce((talks, result, index, scheduleTalkResults) => {
              const { talkToAdd, talkDetailToAdd } = match(result)
                .with({ type: 'proposal' }, ({talk, detailedTalk, totalFavourites}) => {
                  if (totalFavourites !== undefined) {
                    talkStats.push({id: talk.id, totalFavoritesCount: totalFavourites})
                  }

                  return { talkToAdd: talk, talkDetailToAdd: detailedTalk }
                })
                .with({ type: 'overflow'}, ({ room }) => {
                  // Looking for non-overflow result to copy (most of) its properties
                  const nonOverflowTalks = scheduleTalkResults
                    .filter(r => r.type === 'proposal')
                    .map(r => match(r)
                      .with({ type: 'proposal'}, p => p)
                      .otherwise(() => { throw new Error(`This should never happen`); })
                    )
                  if(nonOverflowTalks.length !== 1) {
                    console.warn(`WARNING: found ${nonOverflowTalks.length} non-overflow talks on ${start}--${end} timeslot for an overflow talk`)
                    return { talkToAdd: undefined, talkDetailToAdd: undefined };
                  } else {
                    const {talk, detailedTalk} = nonOverflowTalks[0]

                    const title = `[OVERFLOW] ${talk.title}`;
                    const talkToAdd: Talk = { ...talk, title, room, isOverflow: true }
                    const talkDetailToAdd: DetailedTalk = { ...detailedTalk, title, room, isOverflow: true }

                    return { talkToAdd, talkDetailToAdd };
                  }
                }).with({type: "no-proposal"}, () => {
                  return { talkToAdd: undefined, talkDetailToAdd: undefined };
                }).exhaustive();

              if(talkToAdd){ talks.push(talkToAdd); }
              if(talkDetailToAdd){ detailedTalks.push(talkDetailToAdd); }

              return talks;
            }, [] as Talk[]);

            if(talks.length) {
              daySchedule.timeSlots.push({
                id: key as any,
                start: start as ISODatetime,
                end: end as ISODatetime,
                type: "talks",
                talks
              })
            }
        }
    }

    info("devoxx day crawling done for " + day)
    return {daySchedule, talkStats, talks: detailedTalks, rooms, talkFormats }
}

export default DEVOXX_CRAWLER;
