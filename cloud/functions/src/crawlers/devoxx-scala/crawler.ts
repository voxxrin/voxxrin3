import {
    DevoxxScalaConference,
    DevoxxScalaConferences,
    DevoxxScalaProposalTypesList, DevoxxScalaSchedule,
    DevoxxScalaSimpleSpeaker,
    DevoxxScalaSpeaker,
    DevoxxScalaTracksList,
    Link
} from "./types"
import {
    Break, BreakTimeSlot,
    DailySchedule,
    DetailedTalk, ScheduleTimeSlot,
    Speaker,
    TalksTimeSlot, ThemedTalkFormat, ThemedTrack
} from "../../../../../shared/daily-schedule.firestore"
import { FullEvent } from "../../models/Event";
import { ISODatetime } from "../../../../../shared/type-utils";
import { ListableEvent } from "../../../../../shared/event-list.firestore";
import { Temporal } from "@js-temporal/polyfill";
import {z} from "zod";
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import axios from "axios";
import {
    EVENT_DESCRIPTOR_PARSER, THEMABLE_TALK_FORMAT_PARSER, THEMABLE_TALK_TRACK_PARSER,
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {match, P} from "ts-pattern";

const DEVOXX_SCALA_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    talkFormats: true,
    talkTracks: true,
    id: true,
    description: true
}).extend({
    cfpHostname: z.string(),
    talkTracks: z.array(THEMABLE_TALK_TRACK_PARSER.omit({ title: true })),
    talkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER.omit({ id: true, duration: true }))
})

function findLink(links: Link[], relName: string, descriptor: z.infer<typeof DEVOXX_SCALA_DESCRIPTOR_PARSER>) {
    const fullRel = `http://${descriptor.cfpHostname}/api/profile/${relName}`
    const matchinglink = links.find(l => l.rel === fullRel);
    if(!matchinglink) {
        throw new Error(`No link found matching rel=${fullRel}`)
    }
    return matchinglink;
}

async function loadResources<T, R = T>(
    links: Link[], relName: string,
    descriptor: z.infer<typeof DEVOXX_SCALA_DESCRIPTOR_PARSER>,
    callback: (rawData: T[]) => Promise<R[]>): Promise<R[]> {

    const link = findLink(links, relName, descriptor);
    const resources: T[] = (await axios.get(`${link.href}`)).data
    return await callback(resources);
}

async function loadResource<T>(
    links: Link[], relName: string,
    descriptor: z.infer<typeof DEVOXX_SCALA_DESCRIPTOR_PARSER>): Promise<{url: string, resource: T}> {

    const link = findLink(links, relName, descriptor);
    const resource: T = (await axios.get(`${link.href}`)).data
    return {url: link.href, resource };
}

export const DEVOXX_SCALA_CRAWLER: CrawlerKind<typeof DEVOXX_SCALA_DESCRIPTOR_PARSER> = {
    kind: 'devoxx-scala',
    descriptorParser: DEVOXX_SCALA_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof DEVOXX_SCALA_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }) => {
        const conferences: DevoxxScalaConferences = (await axios.get(`https://${descriptor.cfpHostname}/api/conferences`)).data

        const conferenceResourceUrl = await loadResource<DevoxxScalaConference>(conferences.links, 'conference', descriptor)

        const [speakersByUrl, cfpProposalTypes, cfpTracks] = await Promise.all([
            loadResources<DevoxxScalaSimpleSpeaker, [string, Speaker]>(conferenceResourceUrl.resource.links, 'list-of-speakers', descriptor, async (rawSpeakers) => {
                return await Promise.all(rawSpeakers.map(async rawSpeaker => {
                    const { url: speakerUrl, resource: cfpSpeaker } = await loadResource<DevoxxScalaSpeaker>(rawSpeaker.links, 'speaker', descriptor)
                    const speaker: Speaker = {
                        id: cfpSpeaker.uuid,
                        fullName: `${cfpSpeaker.firstName} ${cfpSpeaker.lastName}`,
                        bio: cfpSpeaker.bioAsHtml,
                        companyName: cfpSpeaker.company,
                        photoUrl: cfpSpeaker.avatarURL || null,
                        social: cfpSpeaker.twitter?[{
                            type: 'twitter', url: cfpSpeaker.twitter
                        }]:[]
                    }
                    return [ speakerUrl, speaker ]
                }))
            }).then(keyValuePairs => new Map(keyValuePairs)),
            loadResource<DevoxxScalaProposalTypesList>(conferenceResourceUrl.resource.links, 'proposalType', descriptor)
                .then(res => res.resource.proposalTypes),
            loadResource<DevoxxScalaTracksList>(conferenceResourceUrl.resource.links, 'track', descriptor).then(res => res.resource.tracks)
        ] as const);

        const daysMatchingCriteria = descriptor.days.filter(d => {
            return !criteria.dayIds || !criteria.dayIds.length || criteria.dayIds.includes(d.id);
        })

        const schedulesResourceUrl = await loadResource<{links: Link[]}>(conferenceResourceUrl.resource.links, 'schedules', descriptor);

        const themedTalkFormatsByIdAndDuration = new Map<string, ThemedTalkFormat>(),
            themedTracksById = new Map<string, ThemedTrack>(),
            talks: DetailedTalk[] = [];

        const dailySchedules: DailySchedule[] = await Promise.all(daysMatchingCriteria.flatMap(async day => {
            const link = schedulesResourceUrl.resource.links.find(link => link.href.endsWith(day.id));
            if(!link) {
                throw new Error(`No link found with href ending with dayId=${day.id}`)
            }

            const schedule: DevoxxScalaSchedule = (await axios.get(`${link.href}`)).data

            const rawSlots = schedule.slots.filter(timeslot => {
                if(timeslot.notAllocated && (timeslot.break || timeslot.talk)) {
                    throw new Error(`Unexpected case: notAllocated=true and filled break or talk !`)
                }
                return !timeslot.notAllocated
            }).map(timeslot => {
                const room = descriptor.rooms.find(room => room.id === timeslot.roomId)
                if(!room) {
                    throw new Error(`Room [${timeslot.roomId}] not found in descriptor for day=${day.id}, talkId=${timeslot.slotId}`)
                }

                const start = Temporal.Instant.fromEpochMilliseconds(timeslot.fromTimeMillis).toString() as ISODatetime,
                     end = Temporal.Instant.fromEpochMilliseconds(timeslot.toTimeMillis).toString() as ISODatetime;

                const timeslotId: ScheduleTimeSlot['id'] = `${start}--${end}`
                const base = {
                    id: timeslotId, start, end
                }

                return match(timeslot)
                    .with({talk: P.not(P.nullish)}, ({talk}) => {
                        const talkSpeakers = talk.speakers.map(sp => {
                            const maybeSpeaker = speakersByUrl.get(sp.link.href);
                            if(!maybeSpeaker) {
                                throw new Error(`Speaker not found with url ${sp.link.href} for day=${day.id}, talkId=${timeslot.slotId}`)
                            }
                            return maybeSpeaker;
                        })

                        const themedTrack = match(themedTracksById.get(talk.trackId))
                            .with(P.nullish, () => {
                                const cfpTrack = cfpTracks.find(t => t.id === talk.trackId)
                                if(!cfpTrack) {
                                    throw new Error(`CFP Track not found with id ${talk.trackId} for day=${day.id}, talkId=${timeslot.slotId}`)
                                }
                                const descriptorTrack = descriptor.talkTracks.find(t => t.id === talk.trackId)
                                if(!descriptorTrack) {
                                    throw new Error(`Descriptor Track not found with id ${talk.trackId} for day=${day.id}, talkId=${timeslot.slotId}`)
                                }

                                const themedTrack: ThemedTrack = {
                                    id: talk.trackId,
                                    title: cfpTrack.title,
                                    themeColor: descriptorTrack.themeColor
                                }

                                themedTracksById.set(talk.trackId, themedTrack)

                                return themedTrack;
                            }).otherwise(themedTrack => themedTrack)

                        const duration = Temporal.Instant.fromEpochMilliseconds(timeslot.fromTimeMillis).until(Temporal.Instant.fromEpochMilliseconds(timeslot.toTimeMillis))

                        const cfpProposalType = cfpProposalTypes.find(pt => pt.label === talk.talkType)
                        if(!cfpProposalType) {
                            throw new Error(`CFP Talk type not found with id ${talk.talkType} for day=${day.id}, talkId=${timeslot.slotId}`)
                        }
                        const formatCacheKey = `${cfpProposalType.id}__${duration.total('minutes')}`
                        const format = match(themedTalkFormatsByIdAndDuration.get(formatCacheKey))
                            .with(P.nullish, () => {
                                const descriptorTalkFormat = descriptor.talkFormats.find(tf => tf.title === talk.talkType)
                                if(!descriptorTalkFormat) {
                                    throw new Error(`Descriptor Talk format not found with id ${talk.talkType} for day=${day.id}, talkId=${timeslot.slotId}`)
                                }

                                const talkFormat: ThemedTalkFormat = {
                                    id: cfpProposalType.id,
                                    title: cfpProposalType.label,
                                    duration: `PT${duration.total('minutes')}m`,
                                    themeColor: descriptorTalkFormat.themeColor
                                }

                                themedTalkFormatsByIdAndDuration.set(formatCacheKey, talkFormat)
                                return talkFormat;
                            }).otherwise(talkFormat => talkFormat)


                        const detailedTalk: DetailedTalk = {
                            ...base,
                            id: timeslot.slotId,
                            title: talk.title,
                            speakers: talkSpeakers,
                            format,
                            language: talk.lang,
                            track: {
                                id: themedTrack.id,
                                title: themedTrack.title
                            },
                            room,
                            summary: talk.summaryAsHtml,
                            description: talk.summaryAsHtml,
                            tags: []
                        }

                        talks.push(detailedTalk);

                        return { ...base, type: 'talks', talk: detailedTalk };
                    }).with({break: P.not(P.nullish)}, ({break: breakEntry}) => {
                        const breakSlot: BreakTimeSlot = {
                            ...base,
                            type: 'break',
                            break: {
                                title: breakEntry.nameEN,
                                icon: match<string, Break['icon']>(breakEntry.id)
                                    .with('ref', () => 'ticket')
                                    .with('coffee', () => 'cafe')
                                    .with('chgt', () => 'cafe')
                                    .with('lunch', () => 'restaurant')
                                    .otherwise(() => 'cafe'),
                                room,
                            }

                        }
                        return breakSlot;
                    }).run();
            })

            const voxxrinSchedule = rawSlots.reduce((schedule, rawSlot) => {
                match([schedule.timeSlots.find(ts => ts.id === rawSlot.id && ts.type === rawSlot.type), rawSlot ])
                    .with([ P.nullish, P._ ], () => {
                        const createdTimeslot: ScheduleTimeSlot = match(rawSlot)
                            .with({ type:'break'}, (breakSlot: BreakTimeSlot) => {
                                return breakSlot;
                            }).with({ type: 'talks'}, (talkSlot) => {
                                const talkTimeslot: TalksTimeSlot = {
                                    id: talkSlot.id,
                                    start: talkSlot.start,
                                    end: talkSlot.end,
                                    type: 'talks',
                                    talks: [ talkSlot.talk ]
                                }
                                return talkTimeslot;
                            }).run();

                        schedule.timeSlots.push(createdTimeslot);

                        return createdTimeslot;
                    }).with([{type: 'break'}, {type: 'break'}], ([existingTimeslot, breakSlot]) => {
                        console.warn(`Multiple breaks for the same break timeslot => ignoring subsequent breaks like : ${JSON.stringify(breakSlot)}`)
                    }).with([{type: 'talks'}, {type: 'talks'}], ([existingTimeslot, talkSlot]) => {
                        existingTimeslot.talks.push(talkSlot.talk);
                    }).run();

                return schedule;
            }, {
                day: day.id,
                timeSlots: []
            } as DailySchedule);

            return voxxrinSchedule;
        }));

        const eventInfo = {
            id: eventId,
            title: descriptor.title,
            description: conferenceResourceUrl.resource.label,
            peopleDescription: descriptor.peopleDescription,
            timezone: descriptor.timezone,
            start: Temporal.PlainDate.from(descriptor.days[0].localDate).toZonedDateTime(descriptor.timezone).startOfDay().toInstant().toString() as ISODatetime,
            end: Temporal.PlainDate.from(descriptor.days[0].localDate).toZonedDateTime(descriptor.timezone).startOfDay().add({days:1}).subtract({seconds:1}).toInstant().toString() as ISODatetime,
            days: descriptor.days,
            logoUrl: descriptor.logoUrl,
            backgroundUrl: descriptor.backgroundUrl,
            websiteUrl: descriptor.websiteUrl,
            location: descriptor.location,
            theming: descriptor.theming,
            keywords: descriptor.keywords
        } as ListableEvent

        const eventDescriptor: ConferenceDescriptor = {
            ...eventInfo,
            headingTitle: descriptor.headingTitle,
            features: descriptor.features,
            talkFormats: Array.from(themedTalkFormatsByIdAndDuration.values()),
            talkTracks: Array.from(themedTracksById.values()),
            supportedTalkLanguages: descriptor.supportedTalkLanguages,
            rooms: descriptor.rooms,
            infos: descriptor.infos
        }

        const event: FullEvent = {
            id: eventId, info: eventInfo, daySchedules: dailySchedules,
            talks, conferenceDescriptor: eventDescriptor
        }
        return event
    }
};
