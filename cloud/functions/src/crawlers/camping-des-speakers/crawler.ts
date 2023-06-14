import {z} from "zod";
import {FullEvent} from "../../models/Event";
import {
    BreakTimeSlot,
    DailySchedule, DetailedTalk, ScheduleTimeSlot,
    Speaker, TalksTimeSlot,
} from "../../../../../shared/dayly-schedule.firestore";
import * as cheerio from 'cheerio';
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Day} from "../../../../../shared/event-list.firestore";
import axios from "axios";
import {
    BREAK_PARSER,
    BREAK_TIME_SLOT_PARSER,
    DAY_PARSER,
    EVENT_DESCRIPTOR_PARSER
} from "../crawler-parsers";
import {CrawlCriteria, CrawlerKind} from "../crawl";
import {ISODatetime} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";

const CAMPING_DES_SPEAKERS_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    id: true
}).extend({
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

function extractRawTimeCoordinatesFrom(rawTimeCoords: string, confDescriptor: z.infer<typeof CAMPING_DES_SPEAKERS_PARSER>, talkId: string){
    const [dayId, rawStartingTime, rawDurationWithMinutes] = rawTimeCoords.split(" - ")
    const [ durationStr, ..._] = rawDurationWithMinutes.split(" ")
    const minutes = Number(durationStr)

    const day = confDescriptor.days.find(d => d.id === dayId)
    if(!day) {
        throw new Error(`Day [${dayId}] not found in conference descriptor for talk ${talkId}`);
    }
    if(!minutes || isNaN(minutes)) {
        throw new Error(`Invalid duration [${rawDurationWithMinutes}] for talk ${talkId}`);
    }

    const start = Temporal.ZonedDateTime.from(`${day.localDate}T${rawStartingTime.replace("h",":")}:00[${confDescriptor.timezone}]`),
          end = start.add({ minutes })

    return { day, start, end, duration: minutes };
}

export const CAMPING_DES_SPEAKERS_CRAWLER: CrawlerKind<typeof CAMPING_DES_SPEAKERS_PARSER> = {
    kind: 'camping-des-speakers',
    descriptorParser: CAMPING_DES_SPEAKERS_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof CAMPING_DES_SPEAKERS_PARSER>, criteria: { dayIds?: string[]|undefined }): Promise<FullEvent> => {
        const $schedulePage = cheerio.load((await axios.get(`https://camping-speakers.fr/sessions/`, {responseType: 'text'})).data);

        const days = descriptor.days;

        const rawDetailedTalks = (await Promise.all(
            $schedulePage(`.session h4 a` as string).map(async(_, sessionLink) => {
                const $sessionLink = $schedulePage(sessionLink);

                const talkUrl = $sessionLink.attr()?.href;

                if(!talkUrl) {
                    return undefined;
                }

                const talkId = extractIdFromUrl(talkUrl);
                const $talkPage = cheerio.load((await axios.get(`https://camping-speakers.fr/sessions/${talkUrl}`, {responseType: 'text'})).data);

                // const eventType = $talkPage(`.eventSingle-type`).text().trim()
                // const dayId = $talkPage(`.eventSingle-day`).text().trim()
                const timeCoordinates = extractRawTimeCoordinatesFrom($talkPage(`.when`).text().trim(), descriptor, talkId)

                const roomId = $talkPage(`.where`).text().trim()
                const room = descriptor.rooms.find(r => r.id === roomId);
                if(!room) {
                    throw new Error(`No room found matching ${roomId} in descriptor.rooms (${descriptor.rooms.map(r => r.id).join(", ")})`)
                }

                const trackId = 'NoTrack'
                const track = descriptor.talkTracks.find(t => t.id === trackId);
                if(!track) {
                    throw new Error(`No track found matching ${trackId} in descriptor.talkTracks (${descriptor.talkTracks.map(t => t.id).join(", ")})`)
                }
                const format = descriptor.talkFormats.find(f => f.duration === `PT${timeCoordinates.duration}m`)
                if(!format) {
                    throw new Error(`No talk format found matching duration [PT${timeCoordinates.duration}m] in descriptor.talkFormats (${descriptor.talkFormats.map(f => f.duration).join(", ")})`)
                }

                let summary: string|null, title: string|null;
                summary = $talkPage(`.content`).html();
                title = $talkPage(`h2`).text().trim();

                const speakerUrls = $talkPage(`.speakers a`).map( (_, speakerLink) => {
                    const speakerUrl = $talkPage(speakerLink).attr()?.href;
                    if(!speakerUrl) {
                        return undefined;
                    }

                    const speakerId = extractIdFromUrl(speakerUrl);
                    return { speakerId, speakerUrl };
                }).toArray().filter(sp => !!sp);

                return {
                    talkId, room, track, title, summary,
                    lang: "FR", format, day: timeCoordinates.day,
                    start: timeCoordinates.start.toInstant().toString() as ISODatetime, startZDT: timeCoordinates.start,
                    end: timeCoordinates.end.toInstant().toString() as ISODatetime, endZDT: timeCoordinates.end,
                    minutesDuration: timeCoordinates.duration, speakerUrls,
                };
            }).toArray()
        ));

        const uniqueSpeakerUrls = Array.from(new Set(rawDetailedTalks.flatMap(t => t!.speakerUrls.map(sp => sp.speakerUrl))))
        const speakers = await Promise.all(uniqueSpeakerUrls.map(async spUrl => {
            const $speakerPage = cheerio.load((await axios.get(`${spUrl}`, {responseType: 'text'})).data);

            const speakerId = extractIdFromUrl(spUrl);

            const photoUrl = `https://camping-speakers.fr${$speakerPage(`img.team_member`).attr()?.src}`;
            const speakerFullName = $speakerPage(`h1`).text().trim()
            const speakerTitle = $speakerPage(`h2`).text().trim()
            const speakerBio = $speakerPage(`.content`).html()

            const speaker: Speaker = {
                id: speakerId,
                fullName: speakerFullName,
                photoUrl,
                companyName: speakerTitle || "",
                bio: speakerBio || "",
                social: []
            }

            return { url: spUrl, speaker };
        }))

        const confDescriptor: ConferenceDescriptor = {
            id: eventId,
            title: descriptor.title,
            days: descriptor.days,
            headingTitle: descriptor.headingTitle,
            description: descriptor.description || "",
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
