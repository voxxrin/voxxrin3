import {z} from "zod";
import {FullEvent} from "../../models/Event";
import {
    BreakTimeSlot,
    DailySchedule, DetailedTalk, Room, ScheduleTimeSlot,
    Speaker, Talk, TalksTimeSlot,
} from "../../../../../shared/daily-schedule.firestore";
import * as cheerio from 'cheerio';
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Day} from "../../../../../shared/event-list.firestore";
import {
    BREAK_PARSER,
    BREAK_TIME_SLOT_PARSER,
    DAY_PARSER,
    EVENT_DESCRIPTOR_PARSER, SPEAKER_PARSER
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {ISODatetime} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {match, P} from "ts-pattern";
import {http} from "../utils";
import {ISO_DATETIME_PARSER} from "../../utils/zod-parsers";

/**
 * WARNING: THIS IS AN AWFUL CRAWLER IMPL
 * based on a lot of DOM assumptions (that may change over time)
 * Please consider replacing it by official conference-hall crawler once it will be implemented
 * (see https://twitter.com/fcamblor/status/1719417132792820136)
 */

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
    descriptorParser: BDXIO_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof BDXIO_PARSER>, criteria: { dayIds?: string[]|undefined }): Promise<FullEvent> => {
        let baseUrl = `https://bdxio.fr`;
        const $schedulePage = cheerio.load(await http.getAsText(`${baseUrl}/schedule`));

        const days = descriptor.days;
        const day = days[0];

        const UNALLOCATED_ROOM: Room = {
            id: "Unallocated room",
            title: "Unallocated room"
        }

        // Ugly workaround since removal of meaningful classes
        // thanks to tailwing...
        // https://github.com/bdxio/bdxio.site/commit/98253f39254bb03279be68f5d9409e2e5eb14a08#diff-15d9d91dd9f98a19c25881bd914271dc8ce2ae85879b0a9da408e07b8a6eda7bR227
        const $slotItems = $schedulePage("ul").eq(2).children("li");
        const detailedTalks = (await Promise.all($slotItems.map(async(_, slotLi) => {
            const rawStart = $schedulePage(slotLi).find("h4").text().trim();
            const startZDT = Temporal.ZonedDateTime.from(`${day.localDate}T${rawStart.replace("h", ":")}:00[${descriptor.timezone}]`)

            const talks = $schedulePage(".talk", slotLi).toArray();
            const potentiallyUndefinedDetailedTalks = await Promise.all(talks.map(async (talkLi) => {
                const $talkLinkAttrs = $schedulePage("a", talkLi).attr();

                // No link on talk (for example: last keynote)
                if(!$talkLinkAttrs) {
                    return undefined;
                }

                const talkUrl = $talkLinkAttrs.href;
                const $talkPage = cheerio.load(await http.getAsText(`${baseUrl}${talkUrl}`));

                const talkId = extractIdFromUrl(talkUrl);

                const roomId = $schedulePage(".uppercase", talkLi).text();
                const room = roomId===''?UNALLOCATED_ROOM:descriptor.rooms.find(r => r.id === roomId)!;
                if(!room) {
                    throw new Error(`[${talkUrl}] No room found matching [${roomId}] in descriptor.rooms (${descriptor.rooms.map(r => r.id).join(", ")}) for talk id ${talkId}`)
                }

                const trackImgSrc = $schedulePage("img", talkLi).attr()?.src;
                const trackId = match(trackImgSrc)
                    .with(undefined, () => "Hors-piste")
                    .when(trackImgSrc => trackImgSrc.endsWith("backend.webp"), () => "Backend")
                    .when(trackImgSrc => trackImgSrc.endsWith("designux.webp"), () => "Design & UX")
                    .when(trackImgSrc => trackImgSrc.endsWith("cloudetdevsecops.webp"), () => "Cloud & DevSecOps")
                    .when(trackImgSrc => trackImgSrc.endsWith("bigdataia.webp"), () => "Big Data & I.A.")
                    .when(trackImgSrc => trackImgSrc.endsWith("methodoarchitecture.webp"), () => "Méthodo & Architecture")
                    .when(trackImgSrc => trackImgSrc.endsWith("horspiste.webp"), () => "Hors-piste")
                    .when(trackImgSrc => trackImgSrc.endsWith("frontend.webp"), () => "Frontend")
                    .run();
                const track = descriptor.talkTracks.find(t => t.id === trackId)!;
                if(!track) {
                    throw new Error(`[${talkUrl}] No track found matching ${trackId} (${trackImgSrc}) in descriptor.talkTracks (${descriptor.talkTracks.map(t => t.id).join(", ")})`)
                }

                const title = $talkPage("h1").text().trim();

                const hasTrack = $talkPage("main section.text-center").length !== 0;
                const talkSummarySectionIndex = hasTrack ? 1 : 0
                const $tagsDiv = $talkPage("main section").eq(talkSummarySectionIndex).find("div").first()
                const formatLabel = $tagsDiv.find("span").eq(0).text().trim()
                const format = descriptor.talkFormats.find(f => f.id === formatLabel)!
                if(!format) {
                    throw new Error(`[${talkUrl}] No talk format found matching [${formatLabel}] in descriptor.talkFormats (${descriptor.talkFormats.map(f => f.id).join(", ")})`)
                }

                const endZDT = startZDT.add(Temporal.Duration.from(format.duration));

                const levelLabel = $tagsDiv.find("span").eq(1).text().trim()
                const langLabel = $tagsDiv.find("span").eq(2).text().trim() || "Français"
                const lang = descriptor.supportedTalkLanguages.find(tl => tl.id === langLabel)!
                if(!lang) {
                    throw new Error(`[${talkUrl}] No lang found matching [${langLabel}] in descriptor.supportedTalkLanguages (${descriptor.supportedTalkLanguages.map(tl => tl.id).join(", ")}) for talkId=${talkId}`)
                }

                const $summaryDiv = $talkPage("section").eq(talkSummarySectionIndex).find("div").eq(1)
                const summaryHtml = $summaryDiv.html();

                const speakers = $talkPage(`main section:gt(${talkSummarySectionIndex})`).map((_, speakerSection) => {
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
                            console.log(`[${talkUrl}] No social link found for URL: ${socialUrl}`)
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

                const start = startZDT.toInstant().toString() as ISODatetime,
                  end = endZDT.toInstant().toString() as ISODatetime;

                const detailedTalk: DetailedTalk = {
                    id: talkId,
                    start, end,
                    title,
                    room, track, format,
                    speakers,
                    summary: summaryHtml || "",
                    description: summaryHtml || "",
                    language: lang.id,
                    tags: Array.from<string>([])
                        .concat(levelLabel ? [levelLabel]:[])
                        .concat(roomId === 'Amphi A' ? ['Sous-Titrage' /* 'Closed Captions' */]:[]),
                    isOverflow: false,
                    assets: []
                };

                return detailedTalk;
            }))

            const detailedTalks = potentiallyUndefinedDetailedTalks.filter(t => !!t).map(t => t!);

            const additionalDetailedTalks = descriptor.additionalTalks.filter(additionnalTalk => {
                const talkEpochStart = Temporal.ZonedDateTime.from(`${additionnalTalk.start}[${descriptor.timezone}]`).epochMilliseconds;

                return talkEpochStart === startZDT.epochMilliseconds;
            }).map(additionnalTalk => {
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

                const endZDT = startZDT.add(Temporal.Duration.from(format.duration));

                const lang = descriptor.supportedTalkLanguages.find(tl => tl.id === additionnalTalk.langId)!
                if(!lang) {
                    throw new Error(`No lang found matching additionnal talk's [${additionnalTalk.langId}] in descriptor.supportedTalkLanguages (${descriptor.supportedTalkLanguages.map(tl => tl.id).join(", ")})`)
                }

                const start = startZDT.toInstant().toString() as ISODatetime,
                    end = endZDT.toInstant().toString() as ISODatetime;

                const detailedTalk: DetailedTalk = {
                    id: additionnalTalk.id,
                    title: additionnalTalk.title,
                    start, end,
                    room, track, language: lang.id, format,
                    speakers: additionnalTalk.speakers,
                    description: additionnalTalk.description,
                    summary: additionnalTalk.summary,
                    tags: [],
                    isOverflow: false,
                    assets: []
                };

                return detailedTalk;
            });

            return detailedTalks.concat(additionalDetailedTalks);
        }))).flatMap(perSlotDetailedTalks => perSlotDetailedTalks);

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
            backgroundUrl: descriptor.backgroundUrl,
            theming: descriptor.theming as ConferenceDescriptor['theming'],
            rooms: descriptor.rooms.concat(UNALLOCATED_ROOM),
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

        const talksTimeSlots = detailedTalks.reduce((timeslots, detailedTalk) => {
            const talk: Talk = {
                id: detailedTalk.id,
                title: detailedTalk.title,
                room: detailedTalk.room,
                track: detailedTalk.track,
                format: detailedTalk.format,
                language: detailedTalk.language,
                speakers: detailedTalk.speakers,
                isOverflow: false
            }

            const timeslotId: TalksTimeSlot['id'] = `${detailedTalk.start}--${detailedTalk.end}`;
            const timeslot: TalksTimeSlot = match(timeslots.find(tts => tts.id === timeslotId))
                .with(P.nullish, () => {
                    const timeslot: TalksTimeSlot = {
                        id: timeslotId,
                        start: detailedTalk.start, end: detailedTalk.end,
                        type: "talks" as const,
                        talks: []
                    }
                    timeslots.push(timeslot);
                    return timeslot;
                }).otherwise((timeslot) => timeslot);

            timeslot.talks.push(talk);

            return timeslots;
        }, [] as TalksTimeSlot[])


        const dailySchedules: DailySchedule[] = [{
            day: day.id,
            timeSlots: ([] as ScheduleTimeSlot[]).concat(talksTimeSlots).concat(breakTimeSlots)
        }]

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

export default BDXIO_CRAWLER;
