import {z} from "zod";
import {FullEvent} from "../../models/Event";
import {ISODatetime, ISOLocalDate} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {
    Break,
    BreakTimeSlot,
    DetailedTalk,
    ScheduleTimeSlot,
    Speaker,
    Talk,
    TalkFormat,
    TalksTimeSlot,
} from "../../../../../shared/dayly-schedule.firestore";
import * as cheerio from 'cheerio';
import {match, P} from "ts-pattern";
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Day} from "../../../../../shared/event-list.firestore";
import axios from "axios";
import {EVENT_DESCRIPTOR_PARSER} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";

const LA_PRODUCT_CONF_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    id: true
})

const LOCAL_DATE: ISOLocalDate = "2023-05-24";
const TIMEZONE_OFFSET = Temporal.Duration.from({hours: 2})

export const LA_PRODUCT_CONF_CRAWLER: CrawlerKind<typeof LA_PRODUCT_CONF_DESCRIPTOR_PARSER> = {
    kind: 'la-product-conf',
    descriptorParser: LA_PRODUCT_CONF_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof LA_PRODUCT_CONF_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }): Promise<FullEvent> => {
        const $speakersPage = cheerio.load((await axios.get('https://www.laproductconf.com/paris/lpc', {responseType: 'text'})).data);

        const speakers = await Promise.all(
            $speakersPage(".speakers-container a.speaker-thumbnail").map(async (_, speakerThumb) => {
                const $speakerLink = $speakersPage(speakerThumb);

                const $speakerPage = cheerio.load((await axios.get(`https://www.laproductconf.com${$speakerLink.attr()?.href}`, {responseType: 'text'})).data);
                const $speakerPic = $speakerPage('.speaker-picture-bg')
                const picture = $speakerPic.attr()?.style.replace(/.*background-image\s*:\s*url\("([^"]+)"\)/gi, "$1");
                const speakerFullname = $speakerPage(".speaker-description-box h2").text().trim()
                const speakerTitle = $speakerPage(".speaker-description-box .subtitle").text().trim()
                const bio = $speakerPage(".paragraph-box .w-richtext").html()

                const speaker: Speaker = {
                    photoUrl: picture || "",
                    id: speakerFullname,
                    social: [],
                    fullName: speakerFullname,
                    companyName: speakerTitle,
                    bio: bio || "",
                };
                return speaker;
            })
        )

        const $schedulePage = cheerio.load((await axios.get(`https://www.laproductconf.com/paris/schedule`, {responseType: 'text'})).data);

        const nonMergedTimeslots: ScheduleTimeSlot[] = [],
            talks: DetailedTalk[] = [];
        $schedulePage(".tabs-menu > a").map((tabIdx, tab) => {
            const $tab = $schedulePage(tab);
            const roomId = $tab.data()['wTab']

            const tabContent = $schedulePage(`.tabs-content [data-w-tab='${roomId}']`)
            const rawTimeslots = tabContent.find('.expand-box-container')
                .map((_, timeslot) => {
                    const $timeslot = $schedulePage(timeslot);
                    const rawTime = $timeslot.find(".time-text").text();
                    const timerange = rawTimeRangeToPartialTimeRange(rawTime, LOCAL_DATE, TIMEZONE_OFFSET);
                    const rawParagraphs = $timeslot.find(".activity-description .paragraph")
                        .map((_, par) => $schedulePage(par).text().trim())
                        .toArray() as []|[string]|[string,string];

                    type MatchingResult = {
                        timerange: {start: ISODatetime|undefined, end: ISODatetime|undefined}
                    } & ({
                        type: 'Break', breakLabel: string
                    } | {
                        type: 'Talk', title: string, speakers: Speaker[]
                    });

                    const result = match([rawTime, timerange, rawParagraphs])
                        .with([P.any, P.any, ['Welcome Coffee']], ([_, timerange, [breakLabel]]) => {
                            const res: MatchingResult = { timerange, type: 'Break', breakLabel };
                            return res;
                        }).with([P.any, {start:undefined, end: undefined}, P.any], ([breakLabel, timerange, [p1, p2]]) => {
                            const res: MatchingResult = { timerange, type: 'Break', breakLabel };
                            return res;
                        }).with([P.any, P.any, P.array(P.string)], ([_, timerange, [title, p2]]) => {
                            const matchingSpeakers = p2?findSpeakers(p2, speakers):[];

                            const res: MatchingResult = { timerange, type: 'Talk', title, speakers: matchingSpeakers };
                            return res;
                        }).run();

                    return result;
                }).toArray()

            Array.prototype.push.apply(nonMergedTimeslots, rawTimeslots.map((ts, idx) => {
                const start = ts.timerange.start || rawTimeslots[idx-1].timerange.end as ISODatetime;
                const end = ts.timerange.end || rawTimeslots[idx+1]?.timerange?.start || `${LOCAL_DATE}T18:00:00.000Z` as ISODatetime;

                const timeslotId = `${start}__${end}__break` as ScheduleTimeSlot['id'];
                if(ts.type === 'Break') {
                    const icon = match<string, BreakTimeSlot['break']['icon']>(timeslotId)
                        .when(id => [
                                '2023-05-24T06:30:00.000Z__2023-05-24T07:00:00.000Z__break',
                                '2023-05-24T08:15:00.000Z__2023-05-24T08:45:00.000Z__break',
                                '2023-05-24T13:45:00.000Z__2023-05-24T14:15:00.000Z__break',
                            ].includes(id),
                            _ => 'cafe'
                        )
                        .when(id => [
                                '2023-05-24T10:30:00.000Z__2023-05-24T12:00:00.000Z__break',
                            ].includes(id),
                            _ => 'restaurant'
                        )
                        .when(id => [
                                '2023-05-24T16:00:00.000Z__2023-05-24T18:00:00.000Z__break',
                                '2023-05-24T15:00:00.000Z__2023-05-24T18:00:00.000Z__break',
                            ].includes(id),
                            _ => 'beer'
                        ).run();

                    const breakTimeslot: BreakTimeSlot = {
                        start,
                        end,
                        id: `${start}__${end}__break` as any,
                        type: 'break',
                        break: {
                            title: ts.breakLabel,
                            icon,
                            room: descriptor.rooms[tabIdx]
                        },
                    };

                    return breakTimeslot;
                } else {
                    const overrides: Pick<TalksTimeSlot, 'id'|'start'|'end'> = match(timeslotId)
                        .when(id => [
                                '2023-05-24T21:45:00.000Z__2023-05-24T10:30:00.000Z__talk',
                            ].includes(id),
                            _ => ({
                                id: '2023-05-24T09:45:00.000Z__2023-05-24T10:30:00.000Z__talk' as TalksTimeSlot['id'],
                                start: '2023-05-24T09:45:00.000Z' as ISODatetime,
                                end
                            })
                        ).when(id => [
                                '2023-05-24T21:45:00.000Z__2023-05-24T10:30:00.000Z__break',
                            ].includes(id),
                            _ => ({
                                id: '2023-05-24T21:45:00.000Z__2023-05-24T10:30:00.000Z__break' as TalksTimeSlot['id'],
                                start: '2023-05-24T09:45:00.000Z' as ISODatetime,
                                end
                            })
                        ).otherwise(() => ({ id: timeslotId, start, end }));

                    const duration = new Date(overrides.end).getTime() - new Date(overrides.start).getTime();
                    const format = descriptor.talkFormats.find(t => t.id === `talk${duration/60000}`) as TalkFormat;

                    const detailedTalk: DetailedTalk = {
                        start: overrides.start,
                        end: overrides.end,
                        speakers: ts.speakers,
                        format: {
                            id: format.id,
                            title: format.title,
                            duration: format.duration
                        },
                        language: '',
                        id: `${timeslotId}__${idx}`,
                        title: ts.title,
                        track: {
                            id: descriptor.talkTracks[tabIdx].id,
                            title: descriptor.talkTracks[tabIdx].title
                        },
                        room: descriptor.rooms[tabIdx],
                        summary: '',
                        description: '',
                        tags: []
                    };

                    talks.push(detailedTalk);

                    const talksTimeslot: TalksTimeSlot = {
                        start: overrides.start,
                        end: overrides.end,
                        id: overrides.id,

                        type: 'talks',
                        talks: [{
                            speakers: detailedTalk.speakers,
                            format: detailedTalk.format,
                            language: detailedTalk.language,
                            id: detailedTalk.id,
                            title: detailedTalk.title,
                            track: detailedTalk.track,
                            room: detailedTalk.room,
                        }],
                    }
                    return talksTimeslot;
                }
            }));
        })

        const dedupedTimeslotsPerId = nonMergedTimeslots.reduce((result, timeslot) => {
            const existingTimeslot = match(result[timeslot.id])
                .with(P.nullish, () => {
                    result[timeslot.id] = timeslot;
                    return result[timeslot.id];
                }).otherwise(existingTimeslot => {
                    match([timeslot, existingTimeslot])
                        .with([{type: 'talks'}, {type: 'talks'}], ([talksTimeSlot, talksExistingTimeslot]) => {
                            talksExistingTimeslot.talks.push(talksTimeSlot.talks[0]);
                        })

                    return existingTimeslot;
                })

            return result;
        }, {} as Record<string, ScheduleTimeSlot>)

        const timeSlots = Object.values(dedupedTimeslotsPerId);

        const confDescriptor: ConferenceDescriptor = {
            id: eventId,
            title: descriptor.title,
            days: descriptor.days as Day[],
            headingTitle: descriptor.headingTitle,
            description: descriptor.description,
            keywords: descriptor.keywords,
            location: descriptor.location,
            logoUrl: descriptor.logoUrl,
            timezone: descriptor.timezone,
            websiteUrl: descriptor.websiteUrl,
            peopleDescription: descriptor.peopleDescription || "",
            backgroundUrl: descriptor.backgroundUrl,
            theming: descriptor.theming as ConferenceDescriptor['theming'],
            rooms: descriptor.rooms,
            talkTracks: descriptor.talkTracks,
            talkFormats: descriptor.talkFormats as ConferenceDescriptor['talkFormats'],
            infos: descriptor.infos,
            features: descriptor.features,
            supportedTalkLanguages: descriptor.supportedTalkLanguages
        };

        const fullEvent: FullEvent = {
            id: eventId,
            info: {
                id: eventId,
                title: descriptor.title,
                days: descriptor.days as any,
                theming: descriptor.theming as any,
                description: descriptor.description,
                keywords: descriptor.keywords,
                location: descriptor.location,
                logoUrl: descriptor.logoUrl,
                timezone: descriptor.timezone,
                websiteUrl: descriptor.websiteUrl,
                peopleDescription: descriptor.peopleDescription as any,
                backgroundUrl: descriptor.backgroundUrl
            },
            conferenceDescriptor: confDescriptor,
            daySchedules: [{ day: LOCAL_DATE, timeSlots }],
            talks,
        };

        return fullEvent;
    }
} as const;

function rawTimeRangeToPartialTimeRange(rawTimeRange: string, localDate: ISOLocalDate, timezoneOffset: Temporal.Duration): {start: ISODatetime|undefined, end: ISODatetime|undefined} {
    const [rawStart, rawEnd] = rawTimeRange.toUpperCase().split(" TO ");

    const start = rawTimeToISOTime(rawStart, localDate, timezoneOffset);
    if(start === undefined) {
        return {start: undefined, end: undefined};
    }

    const end = rawEnd?rawTimeToISOTime(rawEnd, localDate, timezoneOffset):undefined;
    return {start, end};
}

function rawTimeToISOTime(rawTimeWithAMPM: string, localDate: ISOLocalDate, timezoneOffset: Temporal.Duration): ISODatetime|undefined {
    const [rawTime, ampm] = rawTimeWithAMPM.split(" ");
    let [rawHour, rawMinutes] = rawTime.split(":").map(Number);

    if(isNaN(rawHour)) {
        return undefined;
    }

    rawMinutes = rawMinutes || 0;

    rawHour -= (rawHour===12)?12:0;
    rawHour += (ampm === 'PM')?12:0;

    let rawTotalMinutes = rawHour*60+rawMinutes;
    rawTotalMinutes -= timezoneOffset.total('minutes');

    const hours = Math.floor(rawTotalMinutes/60);
    const minutes = rawTotalMinutes - hours*60;

    return `${localDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000Z` as ISODatetime;
}

function findSpeakers(rawSpeakers: string, speakers: Speaker[]): Speaker[] {
    const lowercasedSpeaker = rawSpeakers.toLowerCase().trim();
    return speakers.filter(sp => {
        const fullnameChunks = sp.fullName.split(" ");
        const lastName = fullnameChunks[fullnameChunks.length-1].toLowerCase();
        return lowercasedSpeaker.includes(lastName);
    });
}
