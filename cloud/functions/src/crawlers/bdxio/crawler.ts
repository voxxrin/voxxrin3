import {z} from "zod";
import {FullEvent} from "../../models/Event";
import {
    BreakTimeSlot,
    DailySchedule, DetailedTalk, ScheduleTimeSlot,
    Speaker, Talk, TalksTimeSlot,
} from "../../../../../shared/daily-schedule.firestore";
import * as cheerio from 'cheerio';
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Day} from "../../../../../shared/event-list.firestore";
import axios from "axios";
import {
    BREAK_PARSER,
    BREAK_TIME_SLOT_PARSER,
    DAY_PARSER, DETAILED_TALK_PARSER,
    EVENT_DESCRIPTOR_PARSER, ISO_DATETIME_PARSER, SPEAKER_PARSER, TALKS_TIME_SLOT_PARSER
} from "../crawler-parsers";
import {CrawlCriteria, CrawlerKind} from "../crawl";
import {ISODatetime} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";

export const BDXIO_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    id: true
}).extend({
    days: z.array(DAY_PARSER.extend({
    })),
    breaks: z.array(z.object({
        dayId: z.string(),
        breakTimeslot: BREAK_TIME_SLOT_PARSER.omit({ type: true, id: true }).extend({
            break: BREAK_PARSER.omit({ room: true }).extend({ roomId: z.string() })
        })
    })),
    additionalTalks: z.array(z.object({
        start: ISO_DATETIME_PARSER,
        end: ISO_DATETIME_PARSER,
        id: z.string(),
        title: z.string(),
        roomId: z.string(),
        formatId: z.string(),
        langId: z.string(),
        trackId: z.string(),
        speakers: z.array(SPEAKER_PARSER),
        description: z.string(),
        summary: z.string(),
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

export const BDXIO_CRAWLER: CrawlerKind<typeof BDXIO_PARSER> = {
    kind: 'bdxio',
    descriptorParser: BDXIO_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof BDXIO_PARSER>, criteria: { dayIds?: string[]|undefined }): Promise<FullEvent> => {
        let baseUrl = `https://bdxio.fr`;
        const $schedulePage = cheerio.load((await axios.get(`${baseUrl}/schedule`, {responseType: 'text'})).data);

        const days = descriptor.days;
        const day = days[0];

        const slots = await Promise.all($schedulePage(".schedule > ul > li").map(async(_, slotLi) => {
            const rawStart = $schedulePage(".slots__slot__hour", slotLi).text().trim();
            const startZDT = Temporal.ZonedDateTime.from(`${day.localDate}T${rawStart.replace("h", ":")}:00[${descriptor.timezone}]`)

            const talks = await Promise.all($schedulePage(".talk", slotLi).map(async (_, talkLi) => {
                const $talkLink = $schedulePage("a", talkLi);
                const talkUrl = $talkLink.attr()!.href;
                const $talkPage = cheerio.load((await axios.get(`${baseUrl}${talkUrl}`, {responseType: 'text'})).data);

                const talkId = extractIdFromUrl(talkUrl);

                const roomId = $schedulePage(".room", talkLi).text();
                const room = descriptor.rooms.find(r => r.id === roomId)!;
                if(!room) {
                    throw new Error(`No room found matching ${roomId} in descriptor.rooms (${descriptor.talkTracks.map(r => r.id).join(", ")})`)
                }

                const trackId = $talkPage("main section").first().text()
                const track = descriptor.talkTracks.find(t => t.id === trackId)!;
                if(!track) {
                    throw new Error(`No track found matching ${trackId} in descriptor.talkTracks (${descriptor.talkTracks.map(t => t.id).join(", ")})`)
                }

                const title = $talkPage("h1").text().trim();

                const $tagsDiv = $talkPage("main section").eq(1).find("div").first()
                const formatLabel = $tagsDiv.find("span").eq(0).text().trim()
                const format = descriptor.talkFormats.find(f => f.id === formatLabel)!
                if(!format) {
                    throw new Error(`No talk format found matching [${formatLabel}] in descriptor.talkFormats (${descriptor.talkFormats.map(f => f.id).join(", ")})`)
                }
                const levelLabel = $tagsDiv.find("span").eq(1).text().trim()
                const langLabel = $tagsDiv.find("span").eq(2).text().trim()
                const lang = descriptor.supportedTalkLanguages.find(tl => tl.id === langLabel)!
                if(!lang) {
                    throw new Error(`No lang found matching [${langLabel}] in descriptor.supportedTalkLanguages (${descriptor.supportedTalkLanguages.map(tl => tl.id).join(", ")})`)
                }

                const $summaryDiv = $talkPage("section").eq(1).find("div").eq(1)
                const summaryHtml = $summaryDiv.html();

                const speakers = $talkPage("main section:gt(1)").map((_, speakerSection) => {
                    const $idSection = $talkPage("div", speakerSection).eq(0);
                    const speakerId = $idSection.text().trim();
                    const speakerFullName = $idSection.text().trim()
                    const photoUrl = $idSection.find("img").attr('src')?.trim() || null;

                    const $socialsSection = $talkPage("div", speakerSection).eq(1);
                    const socials = $socialsSection.find(`li a`).map((_, socialLink) => {
                        const $socialLink = $talkPage(socialLink);
                        const socialUrl = $socialLink.attr('href');

                        let type: Speaker['social'][number]['type'] | undefined = undefined;
                        if(socialUrl?.includes('github.com')) {
                            type = 'github';
                        } else if(socialUrl) {
                            console.log(`No social link found for URL: ${socialUrl}`)
                        }

                        if(type && socialUrl) {
                            return { type, url: socialUrl };
                        } else {
                            return undefined;
                        }
                    }).toArray().filter((sp) => !!sp);

                    const $bioSection = $talkPage("div", speakerSection).eq(2);
                    const speakerBio = $bioSection.html()

                    const speakerTitle = ""

                    const speaker: Speaker = {
                        id: speakerId,
                        fullName: speakerFullName,
                        photoUrl,
                        companyName: speakerTitle || "",
                        bio: speakerBio || "",
                        social: socials
                    }

                    return speaker;
                }).get()

                const detailedTalk: Omit<DetailedTalk, "end"> = {
                    id: talkId,
                    title,
                    room,
                    speakers,
                    track,
                    format,
                    summary: summaryHtml || "",
                    description: summaryHtml || "",
                    language: lang.id,
                    start: startZDT.toInstant().toString() as ISODatetime,
                    tags: [levelLabel]
                };

                return detailedTalk;
            }))

            descriptor.additionalTalks.forEach(additionnalTalk => {
                const talkEpochStart = Temporal.ZonedDateTime.from(`${additionnalTalk.start}[${descriptor.timezone}]`).epochMilliseconds;

                if(talkEpochStart === startZDT.epochMilliseconds) {
                    const room = descriptor.rooms.find(r => r.id === additionnalTalk.roomId)!;
                    if(!room) {
                        throw new Error(`No room found matching additionnal talk's ${additionnalTalk.roomId} in descriptor.rooms (${descriptor.talkTracks.map(r => r.id).join(", ")})`)
                    }

                    const track = descriptor.talkTracks.find(t => t.id === additionnalTalk.trackId)!;
                    if(!track) {
                        throw new Error(`No track found matching additionnal talk's ${additionnalTalk.trackId} in descriptor.talkTracks (${descriptor.talkTracks.map(t => t.id).join(", ")})`)
                    }

                    const format = descriptor.talkFormats.find(f => f.id === additionnalTalk.formatId)!
                    if(!format) {
                        throw new Error(`No talk format found matching additionnal talk's [${additionnalTalk.formatId}] in descriptor.talkFormats (${descriptor.talkFormats.map(f => f.id).join(", ")})`)
                    }

                    const lang = descriptor.supportedTalkLanguages.find(tl => tl.id === additionnalTalk.langId)!
                    if(!lang) {
                        throw new Error(`No lang found matching additionnal talk's [${additionnalTalk.langId}] in descriptor.supportedTalkLanguages (${descriptor.supportedTalkLanguages.map(tl => tl.id).join(", ")})`)
                    }

                    talks.push({
                        id: additionnalTalk.id,
                        title: additionnalTalk.title,
                        room, track, language: lang.id, format,
                        start: startZDT.toInstant().toString() as ISODatetime,
                        speakers: additionnalTalk.speakers,
                        description: additionnalTalk.description,
                        summary: additionnalTalk.summary,
                        tags: []
                    })
                }
            })


            return {
                slotStartZDT: startZDT,
                slotStart: startZDT.toInstant().toString() as ISODatetime,
                talks
            }
        }))

        const confDescriptor: ConferenceDescriptor = {
            id: eventId,
            eventFamily: 'bdxio',
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

        const detailedTalks: DetailedTalk[] = [];

        const slotsWithFullDetailedTalks = slots.map((slot, slotIdx) => {
            const slotEnd = slots[slotIdx+1]?.slotStart;
            const timeslotId: ScheduleTimeSlot['id'] = `${slot.slotStart}--${slotEnd}`

            const voxxrinTimeslot: TalksTimeSlot = {
                id: timeslotId,
                start: slot.slotStart,
                end: slotEnd,
                type: 'talks',
                talks: slot.talks.map(talkWithMissingEnd => {
                    const fullDetailedTalk: DetailedTalk = {
                        ...talkWithMissingEnd,
                        end: slots[slotIdx+1]!.slotStart
                    }

                    detailedTalks.push(fullDetailedTalk);

                    const talk: Talk = {
                        id: fullDetailedTalk.id,
                        title: fullDetailedTalk.title,
                        room: fullDetailedTalk.room,
                        track: fullDetailedTalk.track,
                        format: fullDetailedTalk.format,
                        language: fullDetailedTalk.language,
                        speakers: fullDetailedTalk.speakers
                    }
                    return talk;
                }),
            }

            return voxxrinTimeslot;
        }).filter(slot => slot.talks.length > 0);

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

        const dailySchedules: DailySchedule[] = [{
            day: day.id,
            timeSlots: ([] as ScheduleTimeSlot[]).concat(slotsWithFullDetailedTalks).concat(breakTimeSlots)
        }]

        const fullEvent: FullEvent = {
            id: eventId,
            info: {
                id: eventId,
                eventFamily: 'web2day',
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
            daySchedules: dailySchedules,
            talks: detailedTalks,
        };

        return fullEvent;
    }
} as const;
