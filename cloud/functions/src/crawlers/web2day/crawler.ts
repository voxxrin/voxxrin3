import {z} from "zod";
import {detailedTalksToSpeakersLineup, FullEvent} from "../../models/Event";
import {
    BreakTimeSlot,
    DailySchedule, DetailedTalk, ScheduleTimeSlot,
    Speaker, TalksTimeSlot,
} from "../../../../../shared/daily-schedule.firestore";
import * as cheerio from 'cheerio';
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Day} from "../../../../../shared/event-list.firestore";
import {
    BREAK_PARSER,
    BREAK_TIME_SLOT_PARSER,
    DAY_PARSER,
    EVENT_DESCRIPTOR_PARSER
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {ISODatetime} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {http} from "../utils";

const WEB2DAY_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    id: true
}).extend({
    days: z.array(DAY_PARSER.extend({
        schedulePageElementId: z.string()
    })),
    breaks: z.array(z.object({
        dayId: z.string(),
        breakTimeslot: BREAK_TIME_SLOT_PARSER.omit({ type: true, id: true }).extend({
            break: BREAK_PARSER.omit({ room: true }).extend({ roomId: z.string() })
        })
    }))
})

function extractIdFromUrl(url: string) {
    const urlChunks = url.split("/");
    return urlChunks[urlChunks.length-1] || urlChunks[urlChunks.length-2];
}

function extractRangeFromTimeslot(rawTimeslot: string, day: Day, timezone: string): { start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime } {
    const [rawStart, rawEnd] = rawTimeslot.split(" - ");
    return {
        start: Temporal.ZonedDateTime.from(`${day.localDate}T${rawStart.replace("h", ":")}:00[${timezone}]`),
        end: Temporal.ZonedDateTime.from(`${day.localDate}T${rawEnd.replace("h", ":")}:00[${timezone}]`),
    }
}

export const WEB2DAY_CRAWLER: CrawlerKind<typeof WEB2DAY_PARSER> = {
    descriptorParser: WEB2DAY_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof WEB2DAY_PARSER>, criteria: { dayIds?: string[]|undefined }): Promise<FullEvent> => {
        const $schedulePage = cheerio.load(await http.getAsText(`https://web2day.co/programme/`));

        const days = criteria.dayIds?descriptor.days.filter(d => criteria.dayIds?.includes(d.id)):descriptor.days;
        const daySectionSelector = descriptor.days.find(d => criteria.dayIds?.includes(d.id))?.schedulePageElementId

        const rawDetailedTalks = (await Promise.all(
            $schedulePage(`${daySectionSelector?'#'+daySectionSelector:''} .event-link`).map(async(_, eventLink) => {
                const $eventLink = $schedulePage(eventLink);

                const talkUrl = $eventLink.attr()?.href;

                if(!talkUrl) {
                    return undefined;
                }

                const talkId = extractIdFromUrl(talkUrl);
                const $talkPage = cheerio.load(await http.getAsText(`${talkUrl}`));

                const flagUrl = $talkPage(`.eventSingle-flag`).attr()?.src;
                const lang = flagUrl?(flagUrl.endsWith('france.svg')?'FR':'EN'):'FR';

                const eventType = $talkPage(`.eventSingle-type`).text().trim()
                const dayId = $talkPage(`.eventSingle-day`).text().trim()
                const day = descriptor.days.find(d => d.id === dayId)
                if(!day) {
                    throw new Error(`No day found matching ${dayId} in descriptor.days (${descriptor.days.map(d => d.id).join(", ")})`)
                }

                const rawTimeslot = $talkPage(`.eventSingle-hour`).text().trim()
                const {start, end} = extractRangeFromTimeslot(rawTimeslot, day, descriptor.timezone);
                const minutesDuration = start.until(end).total('minutes')
                const roomId = $talkPage(`.eventSingle-room`).text().trim()
                const room = descriptor.rooms.find(r => r.id === roomId);
                if(!room) {
                    throw new Error(`No room found matching ${roomId} in descriptor.rooms (${descriptor.rooms.map(r => r.id).join(", ")})`)
                }

                const universe = $talkPage(`.eventSingle-universe span`).text().trim()
                const track = descriptor.talkTracks.find(t => t.id === universe)!;
                if(!track) {
                    throw new Error(`No track found matching ${universe} in descriptor.talkTracks (${descriptor.talkTracks.map(t => t.id).join(", ")})`)
                }
                const format = descriptor.talkFormats.find(f => f.id === `${eventType}@${minutesDuration}`)!
                if(!format) {
                    throw new Error(`No talk format found matching [${eventType}@${minutesDuration}] in descriptor.talkFormats (${descriptor.talkFormats.map(f => f.id).join(", ")})`)
                }

                let summary: string|null, title: string|null;
                if(lang === 'EN') {
                    const enTalkUrl = talkUrl.replace("web2day.co/event", "web2day.co/en/event");
                    const $enTalkPage = cheerio.load(await http.getAsText(`${enTalkUrl}`));

                    summary = $enTalkPage(`.eventSingle-desc`).html()
                    title = $enTalkPage(`h1`).text().trim()
                } else {
                    summary = $talkPage(`.eventSingle-desc`).html()
                    title = $talkPage(`h1`).text().trim()
                }

                const speakerUrls = $talkPage('.speakerList .speakerSingle-lnk').map( (_, speakerLink) => {
                    const speakerUrl = $talkPage(speakerLink).attr()?.href;
                    if(!speakerUrl) {
                        return undefined;
                    }

                    const speakerId = extractIdFromUrl(speakerUrl);
                    return { speakerId, speakerUrl };
                }).toArray().filter(sp => !!sp);

                return {
                    talkId, room, track, title, summary,
                    lang, format, day,
                    start: start.toInstant().toString() as ISODatetime, startZDT: start,
                    end: end.toInstant().toString() as ISODatetime, endZDT: end,
                    minutesDuration, speakerUrls,
                };
            }).toArray()
        )).filter(talk => talk?.title.indexOf("⚠️ CONFÉRENCE ANNULÉE ⚠️") === -1);

        const uniqueSpeakerUrls = Array.from(new Set(rawDetailedTalks.flatMap(t => t!.speakerUrls.map(sp => sp.speakerUrl))))
        const speakers = await Promise.all(uniqueSpeakerUrls.map(async spUrl => {
            const $speakerPage = cheerio.load(await http.getAsText(`${spUrl}`));

            const speakerId = extractIdFromUrl(spUrl);

            const photoUrl = $speakerPage(`.speakerSingle-img`).attr()?.style.replace(/background: url\(([^)]*)\).*/gi, "$1");
            const speakerFullName = $speakerPage(`.speakerSingle-name`).text().trim()
            const speakerTitle = $speakerPage(`.speakerSingle-excerpt`).text().trim()
            const speakerBio = $speakerPage(`.speakerSingle-desc-all`).html()
            const socials = $speakerPage(`.socialnetList a`).map((_, socialLink) => {
                const $socialLink = $speakerPage(socialLink);

                let type: Speaker['social'][number]['type'] | undefined = undefined;
                if($socialLink.hasClass('linkedin')) {
                    type = 'linkedin';
                } else if($socialLink.hasClass('twitter')) {
                    type = 'twitter';
                } else if($socialLink.hasClass('mastodon')) {
                    type = 'mastodon';
                } else if($socialLink.hasClass('instagram')) {
                    type = 'instagram';
                } else if($socialLink.hasClass('youtube')) {
                    type = 'youtube';
                } else if($socialLink.hasClass('twitch')) {
                    type = 'twitch';
                }

                const url = $socialLink.attr()?.href

                if(!type || !url) {
                    console.log(`Unsupported speaker classes => ${$socialLink.attr()?.class}`);
                    return undefined;
                }

                return { type, url };
            }).toArray().filter(sp => !!sp);

            const speaker: Speaker = {
                id: speakerId,
                fullName: speakerFullName,
                photoUrl,
                companyName: speakerTitle || "",
                bio: speakerBio || "",
                social: socials
            }

            return { url: spUrl, speaker };
        }))

        const confDescriptor: FullEvent['conferenceDescriptor'] = {
            id: eventId,
            title: descriptor.title,
            days: descriptor.days as Day[],
            headingTitle: descriptor.headingTitle,
            headingSubTitle: descriptor.headingSubTitle,
            headingBackground: descriptor.headingBackground,
            description: descriptor.description,
            keywords: descriptor.keywords,
            location: descriptor.location,
            logoUrl: descriptor.logoUrl,
            timezone: descriptor.timezone,
            peopleDescription: descriptor.peopleDescription || "",
            buyTicketsUrl: descriptor.buyTicketsUrl || null,
            backgroundUrl: descriptor.backgroundUrl,
            theming: descriptor.theming as ConferenceDescriptor['theming'],
            rooms: descriptor.rooms,
            talkTracks: descriptor.talkTracks,
            talkFormats: descriptor.talkFormats as ConferenceDescriptor['talkFormats'],
            infos: descriptor.infos,
            features: descriptor.features,
            supportedTalkLanguages: descriptor.supportedTalkLanguages,
            formattings: descriptor.formattings || {
              talkFormatTitle: 'with-duration',
              parseMarkdownOn: [],
            },
        };

        const detailedTalks = rawDetailedTalks.map(rawTalk => {
            const detailedTalk: DetailedTalk = {
                id: rawTalk!.talkId,
                title: rawTalk!.title,
                room: rawTalk!.room,
                speakers: rawTalk!.speakerUrls.map(spUrl => {
                    return speakers.find(sp => sp.url === spUrl.speakerUrl)!.speaker;
                }),
                track: rawTalk!.track,
                format: rawTalk!.format,
                summary: rawTalk!.summary || "",
                description: rawTalk!.summary || "",
                language: descriptor.supportedTalkLanguages.find(lang => lang.id === rawTalk!.lang)!.id,
                tags: [],
                isOverflow: false,
                assets: [],
                allocation: { start: rawTalk!.start, end: rawTalk!.end, }
            };
            return detailedTalk;
        });

        const dailySchedules: DailySchedule[] = days.map(day => {
            const talkTimeSlots: TalksTimeSlot[] = rawDetailedTalks.reduce((talkTimeSlots, rawTalk) => {
                if(rawTalk!.day.id !== day.id) {
                    return talkTimeSlots;
                }

                const timeslotId: ScheduleTimeSlot['id'] = `${rawTalk!.start}--${rawTalk!.end}`

                let timeslot: TalksTimeSlot|undefined = talkTimeSlots.find(ts => ts.id === timeslotId);
                if(!timeslot) {
                    timeslot = {
                        id: timeslotId,
                        start: rawTalk!.start,
                        end: rawTalk!.end,
                        talks: [],
                        type: 'talks'
                    };
                    talkTimeSlots.push(timeslot);
                }

                const detailedTalk = detailedTalks.find(t => t.id === rawTalk!.talkId)!;

                timeslot.talks.push({
                    id: detailedTalk.id,
                    title: detailedTalk.title,
                    room: detailedTalk.room,
                    speakers: detailedTalk.speakers,
                    track: detailedTalk.track,
                    format: detailedTalk.format,
                    language: detailedTalk.language,
                    isOverflow: false
                })

                return talkTimeSlots;
            }, [] as TalksTimeSlot[])


            const breakTimeSlots: BreakTimeSlot[] = descriptor.breaks
                .filter(b => b.dayId === day.id)
                .map(breakDescriptor => {
                    const breakTimeSlot: BreakTimeSlot = {
                        id: `${breakDescriptor.breakTimeslot.start}--${breakDescriptor.breakTimeslot.end}` as BreakTimeSlot['id'],
                        start: breakDescriptor.breakTimeslot.start,
                        end: breakDescriptor.breakTimeslot.end,
                        break: {
                            title: breakDescriptor.breakTimeslot.break.title,
                            icon: breakDescriptor.breakTimeslot.break.icon,
                            room: descriptor.rooms.find(r => r.id === breakDescriptor.breakTimeslot.break.roomId)!,
                        },
                       type: 'break'
                    };

                    return breakTimeSlot;
                });

            const dailySchedule: DailySchedule = {
                day: day.id,
                timeSlots: ([] as ScheduleTimeSlot[]).concat(talkTimeSlots).concat(breakTimeSlots)
            };

            return dailySchedule;
        })

        const fullEvent: FullEvent = {
            id: eventId,
            listableEventInfo: {
                id: eventId,
                title: descriptor.title,
                days: descriptor.days as any,
                theming: descriptor.theming as any,
                description: descriptor.description,
                keywords: descriptor.keywords,
                location: descriptor.location,
                logoUrl: descriptor.logoUrl,
                timezone: descriptor.timezone,
                peopleDescription: descriptor.peopleDescription,
                buyTicketsUrl: descriptor.buyTicketsUrl || null,
                backgroundUrl: descriptor.backgroundUrl
            },
            conferenceDescriptor: confDescriptor,
            daySchedules: dailySchedules,
            talks: detailedTalks,
            lineupSpeakers: detailedTalksToSpeakersLineup(detailedTalks),
        };

        return fullEvent;
    }
} as const;

export default WEB2DAY_CRAWLER
