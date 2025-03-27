import {z} from "zod";
import {detailedTalksToSpeakersLineup, FullEvent} from "../../models/Event";
import {ISODatetime, ISOLocalDate} from "../../../../../shared/type-utils";
import {Temporal} from "@js-temporal/polyfill";
import {
  BreakTimeSlot,
  DetailedTalk,
  ScheduleTimeSlot,
  Speaker,
  TalksTimeSlot,
} from "../../../../../shared/daily-schedule.firestore";
import * as cheerio from 'cheerio';
import {match, P} from "ts-pattern";
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Day} from "../../../../../shared/event-list.firestore";
import {
  BREAK_TIME_SLOT_PARSER,
  DAY_PARSER,
  EVENT_DESCRIPTOR_PARSER,
  TALKS_TIME_SLOT_PARSER,
  TIME_PARSER,
  TIMESLOT_ID_PARSER
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {http} from "../utils";

const LA_PRODUCT_CONF_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
    id: true,
    days: true
}).extend({
    days: z.array(DAY_PARSER.extend({ endTime: TIME_PARSER })).length(1, `Expected a single day event for la-product-conf`),
    timeslotOverrides: z.record(TIMESLOT_ID_PARSER, z.union([
      z.object({
        type: z.literal('remove'),
      }),
      z.object({
        type: z.literal('replace'),
        replacement: z.union([ BREAK_TIME_SLOT_PARSER.partial(), TALKS_TIME_SLOT_PARSER.partial() ])
      })
    ]))
})

const TIMEZONE_OFFSET = Temporal.Duration.from({hours: 2})

export const LA_PRODUCT_CONF_CRAWLER: CrawlerKind<typeof LA_PRODUCT_CONF_DESCRIPTOR_PARSER> = {
    descriptorParser: LA_PRODUCT_CONF_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof LA_PRODUCT_CONF_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }): Promise<FullEvent> => {
        const DAY = descriptor.days[0]
        const LOCAL_DATE = DAY.localDate;
        const $speakersPage = cheerio.load(await http.getAsText('https://www.laproductconf.com/paris/lpc'));

        const speakers = await Promise.all(
            $speakersPage(".speakers-container a.speaker-thumbnail").map(async (_, speakerThumb) => {
                const $speakerLink = $speakersPage(speakerThumb);

                const $speakerPage = cheerio.load(await http.getAsText(`https://www.laproductconf.com${$speakerLink.attr()?.href}`));
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

        const $schedulePage = cheerio.load(await http.getAsText(`https://www.laproductconf.com/paris/schedule`));

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

                    if(rawTime === '') {
                      return undefined;
                    }

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
                }).toArray().filter(res => !!res).map(res => res!);

            const timeslotsParsingResults = rawTimeslots.map((ts, idx): Error|ScheduleTimeSlot => {
              const originalStart = ts.timerange.start || rawTimeslots[idx-1].timerange.end as ISODatetime;
              const originalEnd = ts.timerange.end || rawTimeslots[idx+1]?.timerange?.start || `${LOCAL_DATE}T${DAY.endTime}` as ISODatetime;

              const timeRange = `${originalStart}--${originalEnd}` as const;
              const overrides = descriptor.timeslotOverrides[timeRange];

              const { start, end, timeslotId} = {
                start: originalStart,
                end: originalEnd,
                timeslotId: timeRange,
                ...(overrides?.type === 'replace' ? {
                  start: overrides.replacement.start || originalStart,
                  end: overrides.replacement.end || originalEnd,
                  timeslotId: overrides.replacement.id || timeRange,
                } : {})
              }

              const room = descriptor.rooms[tabIdx];

              if(ts.type === 'Break') {
                const breakTimeslot: BreakTimeSlot = {
                  start,
                  end,
                  id: `${timeslotId}--${room.id}`,
                  type: 'break',
                  break: {
                    title: ts.breakLabel,
                    icon: 'cafe',
                    room
                  },
                  ...(overrides?.type === 'replace' ? overrides.replacement as BreakTimeSlot : {})
                };

                return breakTimeslot;
              } else {
                const duration = new Date(end).getTime() - new Date(start).getTime();
                const expectedFormatId = `talk${duration/60000}`;
                const format = descriptor.talkFormats.find(t => t.id === expectedFormatId);
                if(!format) {
                  return new Error(`No format found with id=${expectedFormatId} for timeslot id ${timeslotId}`)
                }

                const track = descriptor.talkTracks[tabIdx];
                const detailedTalk: DetailedTalk = {
                  speakers: ts.speakers,
                  format: {
                    id: format.id,
                    title: format.title,
                    duration: format.duration
                  },
                  language: '',
                  id: `${room.id}__${timeslotId}__${idx}`,
                  title: ts.title,
                  track,
                  room,
                  summary: '',
                  description: '',
                  tags: [],
                  isOverflow: false,
                  assets: [],
                  allocation: { start, end, }
                };

                talks.push(detailedTalk);

                const talksTimeslot: TalksTimeSlot = {
                  start, end,
                  id: timeRange,

                  type: 'talks',
                  talks: [{
                    speakers: detailedTalk.speakers,
                    format: detailedTalk.format,
                    language: detailedTalk.language,
                    id: detailedTalk.id,
                    title: detailedTalk.title,
                    track: detailedTalk.track,
                    room: detailedTalk.room,
                    isOverflow: false
                  }],
                }
                return talksTimeslot;
              }
            })

          const errors = timeslotsParsingResults
            .filter(tpr => tpr instanceof Error)
            .map(res => res as Error);

          if(errors.length) {
            throw new Error(`Detected errors during timeslots creation:\n${errors.map(err => `  ${err.message}`).join("\n")}`);
          }

          const timeslots = timeslotsParsingResults.map(res => res as ScheduleTimeSlot)
          const filteredTimeslots = timeslots.filter(ts => {
            const override = descriptor.timeslotOverrides[ts.id];
            return (!override || override.type !== 'remove');
          });

          nonMergedTimeslots.push(...filteredTimeslots);
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
            daySchedules: [{ day: LOCAL_DATE, timeSlots }],
            talks,
            lineupSpeakers: detailedTalksToSpeakersLineup(talks),
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

export default LA_PRODUCT_CONF_CRAWLER
