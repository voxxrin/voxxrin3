import {z} from "zod";
import {FullEvent} from "../../models/Event";
import {
    BreakTimeSlot,
    DailySchedule, DetailedTalk, ScheduleTimeSlot,
    Speaker, TalksTimeSlot,
} from "../../../../../shared/daily-schedule.firestore";
import * as cheerio from 'cheerio';
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {
    BREAK_PARSER,
    BREAK_TIME_SLOT_PARSER,
    EVENT_DESCRIPTOR_PARSER
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {ISODatetime} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {http} from "../utils";

const JUG_SUMMERCAMP_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    id: true
}).extend({
    startUrl: z.string(),
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

export const JUG_SUMMERCAMP_CRAWLER: CrawlerKind<typeof JUG_SUMMERCAMP_PARSER> = {
    descriptorParser: JUG_SUMMERCAMP_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof JUG_SUMMERCAMP_PARSER>, criteria: { dayIds?: string[]|undefined }): Promise<FullEvent> => {
        const $schedulePage = cheerio.load(await http.getAsText(descriptor.startUrl));

        const day = descriptor.days[0];

        const rawDetailedTalks = (await Promise.all(
            $schedulePage(`.dl-horizontal h2 a` as string).map(async(idx, sessionLink) => {
                const $sessionLink = $schedulePage(sessionLink);

                const talkUrl = $sessionLink.attr()?.href;

                if(!talkUrl) {
                    throw new Error(`No talk url found in .dl-horizontal #${idx} !`)
                }

                const talkId = extractIdFromUrl(talkUrl);
                const $talkPage = cheerio.load(await http.getAsText(`https://www.jugsummercamp.org${talkUrl}`));

                const roomId = $talkPage(`small a`).text().trim();
                const room = descriptor.rooms.find(r => r.id === roomId);
                if(!room) {
                    throw new Error(`No room found matching ${roomId} in descriptor.rooms (${descriptor.rooms.map(r => r.id).join(", ")})`)
                }

                const rawSubtitle = $talkPage(`small`).text().replace(roomId, "").trim();
                const [ rawStartEndFormat, trackId, level ] = rawSubtitle.split("/").map(str => str.trim());

                const track = descriptor.talkTracks.find(t => t.id === trackId);
                if(!track) {
                    throw new Error(`No track found matching ${trackId} in descriptor.talkTracks (${descriptor.talkTracks.map(t => t.id).join(", ")})`)
                }

                const regexMatch = rawStartEndFormat.split("/")[0].trim().match(/^(\d{2}:\d{2}) - (\d{2}:\d{2})\s*(.*)$/)
                if(!regexMatch) {
                    throw new Error(`Subtitle regex not matching in page ${talkUrl}: ${rawStartEndFormat}`);
                }
                const [_, rawStart, rawEnd, rawFormat] = regexMatch;

                const format = descriptor.talkFormats.find(f => f.id === rawFormat.trim());
                if(!format) {
                    throw new Error(`No talk format found matching id [${rawFormat.trim()}] in descriptor.talkFormats (${descriptor.talkFormats.map(f => f.id).join(", ")})`)
                }

                const start = Temporal.ZonedDateTime.from(`${day.localDate}T${rawStart}:00[${descriptor.timezone}]`),
                    end = Temporal.ZonedDateTime.from(`${day.localDate}T${rawEnd}:00[${descriptor.timezone}]`)

                const title = $talkPage(`h1`).text().trim();
                const $description = $talkPage(`.description`)
                $description.find('.btn-zone').remove();
                const summary = $description.html();

                const speakerUrls = $talkPage(`a.item-speaker`).map( (_, speakerLink) => {
                    const speakerUrl = $talkPage(speakerLink).attr()?.href;
                    if(!speakerUrl) {
                        return undefined;
                    }

                    const speakerId = extractIdFromUrl(speakerUrl);
                    return { speakerId, speakerUrl };
                }).toArray().filter(sp => !!sp);

                return {
                    talkId, room, track, title, summary,
                    lang: "FR", format, day,
                    start: start.toInstant().toString() as ISODatetime, startZDT: start,
                    end: end.toInstant().toString() as ISODatetime, endZDT: end,
                    speakerUrls,
                    tags: [level]
                };
            }).toArray()
        ));

        const uniqueSpeakerUrls = Array.from(new Set(rawDetailedTalks.flatMap(t => t.speakerUrls.map(sp => sp.speakerUrl))))
        const speakers = await Promise.all(uniqueSpeakerUrls.map(async spUrl => {
            const $speakerPage = cheerio.load(await http.getAsText(`https://www.jugsummercamp.org${spUrl}`));

            const speakerId = extractIdFromUrl(spUrl);

            const photoUrl = $speakerPage('.thumbnail img').attr()?.src;
            const speakerFullName = $speakerPage(`h1`).text().trim()
            const speakerBio = $speakerPage(`.description`).html()

            const speaker: Speaker = {
                id: speakerId,
                fullName: speakerFullName,
                photoUrl,
                companyName: "",
                bio: speakerBio || "",
                social: []
            }

            return { url: spUrl, speaker };
        }))

        const confDescriptor: FullEvent['conferenceDescriptor'] = {
            id: eventId,
            title: descriptor.title,
            days: descriptor.days,
            headingTitle: descriptor.headingTitle,
            headingSubTitle: descriptor.headingSubTitle,
            headingBackground: descriptor.headingBackground,
            description: descriptor.description || "",
            keywords: descriptor.keywords,
            location: descriptor.location,
            logoUrl: descriptor.logoUrl,
            timezone: descriptor.timezone,
            peopleDescription: descriptor.peopleDescription || "",
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
                start: rawTalk!.start,
                end: rawTalk!.end,
                tags: rawTalk!.tags,
                isOverflow: false,
                assets: []
            };
            return detailedTalk;
        });

        const dailySchedules: DailySchedule[] = [day].map(day => {
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
                        type: 'break',
                        id: `${breakDescriptor.breakTimeslot.start}--${breakDescriptor.breakTimeslot.end}` as BreakTimeSlot['id'],
                        start: breakDescriptor.breakTimeslot.start,
                        end: breakDescriptor.breakTimeslot.end,
                        break: {
                            title: breakDescriptor.breakTimeslot.break.title,
                            icon: breakDescriptor.breakTimeslot.break.icon,
                            room: descriptor.rooms.find(r => r.id === breakDescriptor.breakTimeslot.break.roomId)!,
                        },
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
            info: {
                id: eventId,
                title: descriptor.title,
                days: descriptor.days as any,
                theming: descriptor.theming as any,
                description: descriptor.description || "",
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

export default JUG_SUMMERCAMP_CRAWLER
