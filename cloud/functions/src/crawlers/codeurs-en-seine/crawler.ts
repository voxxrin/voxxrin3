import {z} from "zod";
import {detailedTalksToSpeakersLineup, FullEvent} from "../../models/Event";
import {
    Break, BreakTimeSlot, DailySchedule,
    DetailedTalk, ScheduleTimeSlot, SocialLink, Speaker, Talk, TalksTimeSlot
} from "../../../../../shared/daily-schedule.firestore";
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Day} from "../../../../../shared/event-list.firestore";
import {
    BREAK_PARSER,
    BREAK_TIME_SLOT_PARSER,
    DAY_PARSER,
    EVENT_DESCRIPTOR_PARSER,
    THEMABLE_TALK_FORMAT_PARSER
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {ISODatetime, ISOLocalDate, Replace} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {match, P} from "ts-pattern";
import {GithubMDXCrawler} from "../github/GithubMDXCrawler";

export const CODEURS_EN_SEINE_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    id: true,
    talkFormats: true
}).extend({
    days: z.array(DAY_PARSER.extend({
    })),
    talkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER.omit({ duration: true })),
    additionalBreaks: z.array(z.object({
        dayId: z.string(),
        breakTimeslot: BREAK_TIME_SLOT_PARSER.omit({ type: true, id: true }).extend({
            break: BREAK_PARSER.omit({ room: true })
        })
    })),
    // the old one was: https://www.codeursenseine.com/_ipx/w_256,q_75/%2Fimages%2Fspeakers%2F{speakerImage}
    speakerPictureTemplate: z.string().default(`https://www.codeursenseine.com/_next/image?url=%2Fimages%2Fspeakers%2F{speakerImage}&w=256&q=75`),
    unknownSpeakerIds: z.array(z.string()).optional().default([]),
})

function extractIdFromUrl(url: string) {
    const urlChunks = url.split("/");
    return urlChunks[urlChunks.length-1] || urlChunks[urlChunks.length-2];
}

function durationFrom(start: ISODatetime, end: ISODatetime, descriptor: z.infer<typeof CODEURS_EN_SEINE_PARSER>) {
    return Temporal.ZonedDateTime.from(`${start}[${descriptor.timezone}]`)
        .until(Temporal.ZonedDateTime.from(`${end}[${descriptor.timezone}]`));
}

type ISODatetimeWithoutTZ = `${ISOLocalDate}T${number}:${number}:${number}`;
type CESTalkMDXData = {
    id: string,
    kind: "conference"|"quicky"|"atelier"|"sponsor"|"pleniere"|"keynote"|"pause",
    title: string,
    start: ISODatetimeWithoutTZ,
    end: ISODatetimeWithoutTZ,
    speakers: string[]|undefined,
    room: string,
    subtitled: boolean,
}
type CESSpeakerMDXData = {
    name: string,
    slug: string,
    image: string,
    twitter: string,
    github: string,
    company: string
}

export const CODEURS_EN_SEINE_CRAWLER: CrawlerKind<typeof CODEURS_EN_SEINE_PARSER> = {
    descriptorParser: CODEURS_EN_SEINE_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof CODEURS_EN_SEINE_PARSER>, criteria: { dayIds?: string[] | undefined }): Promise<FullEvent> => {
        const githubMDXCrawler = new GithubMDXCrawler("CodeursEnSeine", "codeursenseine.com");

        const noTrackId = 'NoTrack';
        const NO_TRACK = descriptor.talkTracks.find(t => t.id === noTrackId)!;
        if(!NO_TRACK) {
            throw new Error(`No track found matching ${noTrackId} in descriptor.talkTracks (${descriptor.talkTracks.map(t => t.id).join(", ")})`)
        }

        const frLangId = 'FR'
        const FR_LANG = descriptor.supportedTalkLanguages.find(tl => tl.id === frLangId)!
        if(!FR_LANG) {
            throw new Error(`No lang found matching [${frLangId}] in descriptor.supportedTalkLanguages (${descriptor.supportedTalkLanguages.map(tl => tl.id).join(", ")})`)
        }

        const hallRoomId = 'hall'
        const HALL_ROOM = descriptor.rooms.find(room => room.id === hallRoomId)!
        if(!HALL_ROOM) {
            throw new Error(`No lang found matching [${hallRoomId}] in descriptor.rooms (${descriptor.rooms.map(room => room.id).join(", ")})`)
        }

        const fetchedSpeakers = await githubMDXCrawler.crawlDirectory("content/speakers", (speakerMDXFile, fileEntry) => {
            const fileMetadata = speakerMDXFile.metadata as CESSpeakerMDXData;

            const speaker: Speaker = {
                id: fileMetadata.slug,
                fullName: fileMetadata.name,
                bio: speakerMDXFile.content,
                companyName: fileMetadata.company,
                photoUrl: descriptor.speakerPictureTemplate.replace("{speakerImage}", fileMetadata.image),
                social: ([] as SocialLink[])
                    .concat(fileMetadata.twitter ? [{type: 'twitter', url: `https://twitter.com/${fileMetadata.twitter.substring("@".length)}`}] as const:[])
                    .concat(fileMetadata.github ? [{type: 'github', url: `https://github.com/${fileMetadata.github}`}] as const:[]),
            }

            return speaker;
        });


        const talkFormats: ConferenceDescriptor['talkFormats'] = [];
        const talksOrBreaks: Array<{start: ISODatetime, end: ISODatetime}&({type: 'talks', talkDetails: DetailedTalk}|{type: 'break', breakSlot: Break})> =
            await githubMDXCrawler.crawlDirectory("content/talks", (mdxFile, fileEntry) => {
                const fileMetadata = mdxFile.metadata as CESTalkMDXData;

                const startZDT = Temporal.PlainDateTime.from(fileMetadata.start).toZonedDateTime(descriptor.timezone)
                const endZDT = Temporal.PlainDateTime.from(fileMetadata.end).toZonedDateTime(descriptor.timezone)
                const start = startZDT.toInstant().toString() as ISODatetime
                const end = endZDT.toInstant().toString() as ISODatetime
                const duration = durationFrom(start, end, descriptor);
                const talkId = fileEntry.name.substring(0, fileEntry.name.length - ".mdx".length);

                return match([fileMetadata])
                    .with([ { kind: P.union("conference","quicky","atelier","sponsor","pleniere","keynote") }], ([talkMetadata]) => {
                        const room = descriptor.rooms.find(r => r.id === fileMetadata.room)!;
                        if(!room) {
                            throw new Error(`No room found matching ${fileMetadata.room} in descriptor.rooms (${descriptor.rooms.map(r => r.id).join(", ")})`)
                        }

                        const formatWithoutDuration = descriptor.talkFormats.find(f => f.id === fileMetadata.kind)!;
                        if(!formatWithoutDuration) {
                            throw new Error(`No format found matching ${fileMetadata.kind} in descriptor.talkFormats (${descriptor.talkFormats.map(f => f.id).join(", ")})`)
                        }

                        const speakers = (fileMetadata.speakers || []).map(speakerId => {
                            if(speakerId === 'todo') {
                                return undefined;
                            }

                            const speaker = match(fetchedSpeakers.find(sp => sp.id === speakerId))
                              .with(P.nullish, () => {
                                if(descriptor.unknownSpeakerIds.includes(speakerId)) {
                                  const unknownSpeaker: Speaker = {
                                    id: speakerId,
                                    fullName: "Speaker inconnu",
                                    companyName: null,
                                    bio: null,
                                    social: [],
                                    photoUrl: null,
                                  }
                                  return unknownSpeaker;
                                }

                                throw new Error(`No speaker found in fetched speakers with id: ${speakerId} ! (context: talkId=${talkId})`);
                              })
                              .otherwise(speaker => speaker)

                            return speaker;
                        }).filter(sp => !!sp).map(sp => sp!);

                        const format = {
                            ...formatWithoutDuration,
                            duration: `PT${duration.total('minutes')}m`
                        } as const

                        if(!talkFormats.find(f => f.id === format.id && f.duration === format.duration)) {
                            talkFormats.push(format);
                        }

                      const talkDetails: DetailedTalk = {
                            id: talkId,
                            speakers,
                            summary: mdxFile.content,
                            description: mdxFile.content,
                            tags: fileMetadata.subtitled ? ['Is subtitled']:[],
                            title: fileMetadata.title,
                            track: NO_TRACK,
                            language: FR_LANG.id,
                            room, format,
                            isOverflow: false,
                            assets: [],
                            allocation: { start, end, }
                      }

                        return { type: 'talks', start, end, talkDetails } as const;
                    }).with([{ kind: "pause" }], ([breakMetadata]) => {
                        const breakSlot: Break = {
                            icon: duration.total('minutes') > 30 ? 'restaurant':'cafe',
                            room: HALL_ROOM,
                            title: breakMetadata.title
                        }

                        return { type: 'break', start, end, breakSlot } as const;
                    }).exhaustive();
                });

        const detailedTalks = talksOrBreaks.map(talkOrBreak => {
            if(talkOrBreak.type === 'talks') {
                return talkOrBreak.talkDetails;
            } else {
                return undefined;
            }
        }).filter(talk => !!talk).map(talk => talk!);

        const timeslots = talksOrBreaks.reduce((timeslots, talkOrBreak) => {
            match([
                timeslots.find(ts => ts.type === talkOrBreak.type && ts.start === talkOrBreak.start && ts.end === talkOrBreak.end),
                talkOrBreak
            ]).with([ P.nullish, {type:"break"} ], ([_, breakSlot]) => {
                const breakTimeslot: BreakTimeSlot = {
                    id: `${breakSlot.start}--${breakSlot.end}--${breakSlot.breakSlot.room.id}`,
                    type: 'break',
                    start: breakSlot.start,
                    end: breakSlot.end,
                    break: breakSlot.breakSlot
                }
                timeslots.push(breakTimeslot)
            }).with([ P.union(P.nullish, {type:'talks'}), {type:"talks"}], ([existingTimeslot, talkSlot]) => {
                const simpleTalk: Talk = {
                    id: talkSlot.talkDetails.id,
                    title: talkSlot.talkDetails.title,
                    room: talkSlot.talkDetails.room,
                    track: talkSlot.talkDetails.track,
                    format: talkSlot.talkDetails.format,
                    language: talkSlot.talkDetails.language,
                    speakers: talkSlot.talkDetails.speakers,
                    isOverflow: false
                }
                if(existingTimeslot) {
                    existingTimeslot.talks.push(simpleTalk);
                } else {
                    const talksTimeslot: TalksTimeSlot = {
                        id: `${talkSlot.start}--${talkSlot.end}`,
                        type: 'talks',
                        start: talkSlot.start,
                        end: talkSlot.end,
                        talks: [simpleTalk]
                    }
                    timeslots.push(talksTimeslot)
                }
            }).with([ {type: 'break'}, {type: "break"}], ([timeslot, breakSlot]) => {
                // No op, existing break timeslot should be enough
            }).run()

            return timeslots;
        }, [] as ScheduleTimeSlot[]).concat(descriptor.additionalBreaks.map(addBreak => ({
            ...addBreak.breakTimeslot,
            id: `${addBreak.breakTimeslot.start}--${addBreak.breakTimeslot.end}--${HALL_ROOM.id}` as BreakTimeSlot['id'],
            type: 'break',
            break: {
                ...addBreak.breakTimeslot.break,
                room: HALL_ROOM
            }
        } as const)))


        const dailySchedules: DailySchedule[] = [{
            day: descriptor.days[0].id,
            timeSlots: timeslots
        }]

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
            theming: descriptor.theming,
            rooms: descriptor.rooms,
            talkTracks: descriptor.talkTracks,
            talkFormats,
            infos: descriptor.infos,
            features: descriptor.features,
            supportedTalkLanguages: descriptor.supportedTalkLanguages,
            formattings: descriptor.formattings || {
              talkFormatTitle: 'with-duration',
              parseMarkdownOn: [],
            },
        };

        const fullEvent: FullEvent = {
            id: eventId,
            listableEventInfo: {
                id: eventId,
                title: confDescriptor.title,
                days: confDescriptor.days,
                theming: confDescriptor.theming,
                description: confDescriptor.description,
                keywords: confDescriptor.keywords,
                location: confDescriptor.location,
                logoUrl: confDescriptor.logoUrl,
                timezone: confDescriptor.timezone,
                peopleDescription: confDescriptor.peopleDescription,
                buyTicketsUrl: confDescriptor.buyTicketsUrl || null,
                backgroundUrl: confDescriptor.backgroundUrl
            },
            conferenceDescriptor: confDescriptor,
            daySchedules: dailySchedules,
            talks: detailedTalks,
            lineupSpeakers: detailedTalksToSpeakersLineup(detailedTalks),
        };

        return fullEvent;
    }
} as const

export default CODEURS_EN_SEINE_CRAWLER;
