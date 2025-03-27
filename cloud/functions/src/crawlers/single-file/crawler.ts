import {FullEvent} from "../../models/Event";
import {z} from "zod";
import {
  BREAK_PARSER,
  DETAILED_TALK_PARSER,
  EVENT_DESCRIPTOR_PARSER,
  FORMATTINGS_CONFIG_PARSER,
} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {ISO_DATETIME_PARSER} from "../../utils/zod-parsers";
import {FullEventBuilder} from "../full-event.builder";
import {omit} from "lodash";
import {Temporal} from "@js-temporal/polyfill";


export const SINGLE_FILE_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
  id: true
}).extend({
  formattings: FORMATTINGS_CONFIG_PARSER, // not optional
  talks: z.array(
    DETAILED_TALK_PARSER
      .omit({ track: true, room: true, format: true, language: true, description: true, allocation: true })
      .extend({
        start: ISO_DATETIME_PARSER,
        end: ISO_DATETIME_PARSER,
        trackId: z.string(),
        roomId: z.string(),
        formatId: z.string(),
        langId: z.string()
      })
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
    const fullEventBuilder = new FullEventBuilder(eventId);

    const eventInfo: FullEvent['listableEventInfo'] = {
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
      buyTicketsUrl: descriptor.buyTicketsUrl || null,
    }

    descriptor.rooms.forEach(room => {
      fullEventBuilder.addRoom(room);
    })
    descriptor.talkTracks.forEach(track => {
      fullEventBuilder.addThemedTrack(track);
    })
    descriptor.talkFormats.forEach(format => {
      fullEventBuilder.addThemedFormat(format);
    })
    descriptor.supportedTalkLanguages.forEach(lang => {
      fullEventBuilder.addThemedLanguage(lang);
    })

    descriptor.talks.forEach(talk => {
      talk.speakers.forEach(speaker => {
        fullEventBuilder.addSpeaker(speaker);
      })
      fullEventBuilder.addTalk({
        ...omit(talk, ['speakers', 'start', 'end']),
        language: talk.langId,
        description: talk.summary,
        speakerIds: talk.speakers.map(sp => sp.id),
      });
      fullEventBuilder.allocateTalk({
        talkId: talk.id,
        start: talk.start,
        maybeRoomId: talk.roomId,
      })
    })

    descriptor.breaks.forEach(breakSlot => {
      fullEventBuilder.addBreak({
        start: breakSlot.start,
        duration: Temporal.Instant.from(breakSlot.start).until(breakSlot.end),
        title: breakSlot.title,
        roomId: breakSlot.roomId,
        icon: breakSlot.icon,
      });
    })

    fullEventBuilder.usingInfosAndDescriptor(eventInfo, {
      headingTitle: descriptor.headingTitle,
      headingSubTitle: descriptor.headingSubTitle,headingBackground: descriptor.headingBackground,
      features: descriptor.features,
      infos: descriptor.infos,
      formattings: descriptor.formattings,
    });

    return fullEventBuilder.createFullEvent();
  }
};


export default SINGLE_FILE_CRAWLER;
