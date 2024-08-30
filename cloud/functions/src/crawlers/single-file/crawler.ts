import {detailedTalksToSpeakersLineup, FullEvent} from "../../models/Event";
import {z} from "zod";
import {
  BREAK_PARSER,
  DETAILED_TALK_PARSER,
  EVENT_DESCRIPTOR_PARSER, FORMATTINGS_CONFIG_PARSER,
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {match, P} from "ts-pattern";
import {
  BreakTimeSlot, DailySchedule,
  ScheduleTimeSlot,
  TalksTimeSlot,
  TimeSlotBase,
} from "../../../../../shared/daily-schedule.firestore";
import {ISO_DATETIME_PARSER} from "../../utils/zod-parsers";


export const SINGLE_FILE_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
  id: true
}).extend({
  formattings: FORMATTINGS_CONFIG_PARSER, // not optional
  talks: z.array(
    DETAILED_TALK_PARSER
      .omit({ track: true, room: true, format: true, language: true, description: true })
      .extend({ trackId: z.string(), roomId: z.string(), formatId: z.string(), langId: z.string() })
  ),
  breaks: z.array(
    BREAK_PARSER
      .omit({ room: true, })
      .extend({ roomId: z.string(), start: ISO_DATETIME_PARSER, end: ISO_DATETIME_PARSER })
  ),
})

function findItemById<T extends {id: string}>(items: T[], id: string, itemName: string) {
  const item = items.find(item => item.id === id);
  if(!item) {
    throw new Error(`No ${itemName} found with id ${id} ! Available ${itemName}s: ${JSON.stringify(items)}`)
  }
  return item;
}

export const SINGLE_FILE_CRAWLER: CrawlerKind<typeof SINGLE_FILE_DESCRIPTOR_PARSER> = {
  descriptorParser: SINGLE_FILE_DESCRIPTOR_PARSER,
  crawlerImpl: async (eventId: string, descriptor: z.infer<typeof SINGLE_FILE_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }) => {
    const eventInfo: FullEvent['info'] = {
      id: eventId,
      title: descriptor.title,
      description: descriptor.description,
      days: descriptor.days,
      timezone: descriptor.timezone,
      keywords: descriptor.keywords,
      location: descriptor.location,
      peopleDescription: descriptor.peopleDescription,
      backgroundUrl: descriptor.backgroundUrl,
      logoUrl: descriptor.logoUrl,
      theming: descriptor.theming,
    }

    const talksTimeslots: TalksTimeSlot[] = descriptor.talks.reduce((timeslots, talk) => {
      const timeslotId = `${talk.start}--${talk.end}` as TimeSlotBase['id']

      const timeslot = match(timeslots.find(ts => ts.id === timeslotId))
        .with(P.nullish, () => {
          const timeslot: TalksTimeSlot = {
            id: timeslotId,
            type: 'talks',
            start: talk.start,
            end: talk.end,
            talks: []
          }
          timeslots.push(timeslot);
          return timeslot;
        }).otherwise(timeslot => timeslot);

      timeslot.talks.push({
        speakers: talk.speakers,
        format: findItemById(descriptor.talkFormats, talk.formatId, "format"),
        language: findItemById(descriptor.supportedTalkLanguages, talk.langId, "language").id,
        id: talk.id,
        title: talk.title,
        track: findItemById(descriptor.talkTracks, talk.trackId, "track"),
        room: findItemById(descriptor.rooms, talk.roomId, "room"),
        isOverflow: talk.isOverflow,
      })

      return timeslots;
    }, [] as TalksTimeSlot[])

    const breaksTimeslots: BreakTimeSlot[] = descriptor.breaks.reduce((timeslots, breakSlot) => {
      const timeslotId = `${breakSlot.start}--${breakSlot.end}` as TimeSlotBase['id']

      const timeslot = match(timeslots.find(ts => ts.id === timeslotId))
        .with(P.nullish, () => {
          const timeslot: BreakTimeSlot = {
            id: timeslotId,
            type: 'break',
            start: breakSlot.start,
            end: breakSlot.end,
            break: {
              room: findItemById(descriptor.rooms, breakSlot.roomId, "room"),
              title: breakSlot.title,
              icon: breakSlot.icon
            }
          }
          timeslots.push(timeslot);
          return timeslot;
        }).otherwise(timeslot => timeslot);

      return timeslots;
    }, [] as BreakTimeSlot[]);

    const timeslots = ([] as ScheduleTimeSlot[])
      .concat(talksTimeslots)
      .concat(breaksTimeslots);

    const dailySchedules: DailySchedule[] = descriptor.days.map(day => ({
      day: day.id,
      timeSlots: timeslots.filter(timeslot => timeslot.start.startsWith(day.localDate))
    }))

    const talks = descriptor.talks.map(detailedTalk => ({
      start: detailedTalk.start,
      end: detailedTalk.end,
      summary: detailedTalk.summary,
      description: detailedTalk.summary,
      tags: detailedTalk.tags,
      assets: detailedTalk.assets,
      speakers: detailedTalk.speakers,
      id: detailedTalk.id,
      title: detailedTalk.title,
      isOverflow: detailedTalk.isOverflow,

      format: findItemById(descriptor.talkFormats, detailedTalk.formatId, "format"),
      language: findItemById(descriptor.supportedTalkLanguages, detailedTalk.langId, "language").id,
      track: findItemById(descriptor.talkTracks, detailedTalk.trackId, "track"),
      room: findItemById(descriptor.rooms, detailedTalk.roomId, "room"),
    }))

    const event: FullEvent = {
      id: eventId,
      info: eventInfo,
      daySchedules: dailySchedules,
      talks,
      conferenceDescriptor: {
        ...eventInfo,
        headingTitle: descriptor.headingTitle,
        headingBackground: descriptor.headingBackground,
        features: descriptor.features,
        talkFormats: descriptor.talkFormats,
        talkTracks: descriptor.talkTracks,
        supportedTalkLanguages: descriptor.supportedTalkLanguages,
        rooms: descriptor.rooms,
        infos: descriptor.infos,
        formattings: descriptor.formattings,
      },
      lineupSpeakers: detailedTalksToSpeakersLineup(talks),
    }
    return event
  }
};


export default SINGLE_FILE_CRAWLER;
