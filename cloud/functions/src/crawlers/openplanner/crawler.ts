import {FullEvent} from "../../models/Event";
import {z} from "zod";
import {EVENT_DESCRIPTOR_PARSER, EVENT_FEATURES_CONFIG_PARSER, RATINGS_CONFIG_PARSER} from "../crawler-parsers";
import {CrawlerKind} from "../crawl";
import {ISO_DATETIME_PARSER} from "../../utils/zod-parsers";
import {
  DailySchedule,
  DetailedTalk, Room,
  ScheduleTimeSlot, Speaker,
  Talk, TalkFormat, TalksTimeSlot,
  Track
} from "../../../../../shared/daily-schedule.firestore";
import {match, P} from "ts-pattern";
import {Temporal} from "@js-temporal/polyfill";
import {ISODatetime} from "../../../../../shared/type-utils";

export const OPENPLANNER_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
  id: true,
  // days: true, // to be removed once days.localDate will be an iso date in openplanner
  // theming: true, // to be removed once hexContrast pattern is fixed in openplanner
  features: true,
  title: true,
  timezone: true,
  backgroundUrl: true,
  logoUrl: true,
  headingTitle: true,
  talkFormats: true,
  talkTracks: true,
  supportedTalkLanguages: true,
  rooms: true,
}).extend({
  openPlannerGeneratedJson: z.string(),
  language: z.string(),
  ratings: RATINGS_CONFIG_PARSER
})

export const OPENPLANNER_GENERATED_SCHEDULE_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
  id: true,
  description: true,
  days: true, // to be put back once days.localDate will be an iso date
  keywords: true,
  location: true,
  websiteUrl: true,
  theming: true, // hexContrast pattern needs to be fixed,
  features: true
}).extend({
  features: EVENT_FEATURES_CONFIG_PARSER.omit({ ratings: true }).extend({
  }),
  sessions: z.record(z.string(), z.object({
    speakers: z.array(z.string()),
    // TODO: remove nested array once fixed on openplanner side
    tags: z.array(z.union([ z.string(), z.array(z.string()) ])),
    title: z.string(),
    id: z.string(),
    startTime: ISO_DATETIME_PARSER,
    endTime: ISO_DATETIME_PARSER,
    trackTitle: z.string()
  })),
  speakers: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    photoUrl: z.string(),
    socials: z.array(z.object({
      icon: z.union([z.literal("twitter"), z.literal("linkedin"), z.literal("github")]),
      link: z.string(),
      name: z.union([z.literal("LinkedIn"), z.literal("Linkedin"), z.literal("Twitter"), z.literal("GitHub")]),
    }))
  }))
})

export const OPENPLANNER_CRAWLER: CrawlerKind<typeof OPENPLANNER_DESCRIPTOR_PARSER> = {
    descriptorParser: OPENPLANNER_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof OPENPLANNER_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }) => {

      const openPlannerSchedule = await fetch(descriptor.openPlannerGeneratedJson)
        .then(resp => resp.json())
        .then(data => OPENPLANNER_GENERATED_SCHEDULE_PARSER.parse(data));

      const talks: DetailedTalk[] = [],
        tracks: Track[] = openPlannerSchedule.talkTracks,
        formats: TalkFormat[] = openPlannerSchedule.talkFormats,
        rooms: Room[] = openPlannerSchedule.rooms;

      const speakers = Object.values(openPlannerSchedule.speakers).map(openPlannerSpeaker => {
        const speaker: Speaker = {
          id: openPlannerSpeaker.id,
          fullName: openPlannerSpeaker.name,
          bio: ``, // TODO: missing info from openplanner
          photoUrl: openPlannerSpeaker.photoUrl,
          companyName: ``, // TODO: missing info from openplanner
          social: openPlannerSpeaker.socials.map(opSocial => ({
            type: match(opSocial.name)
              .with('GitHub', () => 'github' as const)
              .with('Linkedin', () => 'linkedin' as const)
              .with('LinkedIn', () => 'linkedin' as const)
              .with('Twitter', () => 'twitter' as const)
              .exhaustive(),
            url: opSocial.link
          })),
        }
        return speaker;
      })

      const dailySchedules = descriptor.days.map(day => {
        const dailyRawSessions = Object.values(openPlannerSchedule.sessions)
          .filter(session => session.startTime.startsWith(day.localDate))

        const { timeslots} = dailyRawSessions.reduce(({timeslots}, session) => {
          // TODO: Remove random track
          const track: Track = tracks[Math.floor(Math.random()*tracks.length)]

            // match(tracks.find(t => t.title === session.trackTitle))
            // .with(P.nullish, () => {
            //   const newTrack: Track = {
            //     id: session.trackTitle,
            //     title: session.trackTitle
            //   }
            //   tracks.push(newTrack)
            //   return newTrack;
            // }).otherwise(track => track)

          // TODO: refactor session.trackTitle as this is misleading
          const room = rooms.find(room => room.title === session.trackTitle)
          if(!room) {
            throw new Error(`No room found matching ${session.trackTitle} for session ${session.id} !`);
          }

            // match(rooms.find(r => r.title === MAIN_ROOM_TITLE))
            // .with(P.nullish, () => {
            //   const newRoom: Room = {
            //     id: MAIN_ROOM_TITLE,
            //     title: MAIN_ROOM_TITLE
            //   }
            //   rooms.push(newRoom)
            //   return newRoom;
            // }).otherwise(room => room)

          const start = Temporal.Instant.from(session.startTime);
          const end = Temporal.Instant.from(session.endTime);
          const talkDurationInMinutes = start.until(end).total('minutes')
          const formatDuration = `PT${talkDurationInMinutes}m` as const;
          let format = formats.find(format => format.duration === formatDuration)
          if(!format) {
            console.warn(`No format found matching ${formatDuration} for session ${session.id} !`)
            // TODO: remove random format
            format = formats[Math.floor(Math.random()*formats.length)]
            // throw new Error(`No format found matching ${formatDuration} for session ${session.id} !`);
          }
            // match(formats.find(f => f.duration === formatDuration))
            // .with(P.nullish, () => {
            //   const newFormat: TalkFormat = {
            //     id: `talk-${formatDuration}m`,
            //     title: `Talk de ${formatDuration}m`,
            //     duration: formatDuration
            //   }
            //   formats.push(newFormat)
            //   return newFormat;
            // }).otherwise(format => format)

          const talk: Talk = {
            id: session.id,
            title: session.title,
            isOverflow: false,
            language: descriptor.language,
            track,
            room,
            format,
            speakers: session.speakers.map(opSpeakerId => speakers.find(sp => sp.id === opSpeakerId))
              .filter(sp => !!sp).map(sp => sp!),
          }

          const detailedTalk: DetailedTalk = {
            ...talk,
            start: start.toString() as ISODatetime,
            end: end.toString() as ISODatetime,
            tags: session.tags.flatMap(tag => Array.isArray(tag) ? tag : [tag]),
            assets: [],
            // TODO: Missing currently in openplanner
            description: ``,
            summary: ``,
          }

          talks.push(detailedTalk);

          const timeslotId = `${detailedTalk.start}--${detailedTalk.end}` as const
          const talksTimeslot = match(timeslots.find(ts => ts.id === timeslotId))
            .with(P.nullish, () => {
              const talksTimeslot: TalksTimeSlot = {
                id: timeslotId,
                start: detailedTalk.start,
                end: detailedTalk.end,
                type: 'talks',
                talks: []
              }

              timeslots.push(talksTimeslot);
              return talksTimeslot;
            }).with({ type: 'talks'}, (talksTimeslot) => talksTimeslot)
            .otherwise((ts) => { throw new Error(`Unsupported case for timeslot: ${JSON.stringify(ts)}`)})

          talksTimeslot.talks.push(talk);

          return { timeslots };
        }, {timeslots: []} as {timeslots: ScheduleTimeSlot[]})

        const dailySchedule: DailySchedule = {
          day: day.id,
          timeSlots: timeslots
        }

        return dailySchedule;
      })

      const event: FullEvent = {
        id: eventId,
        conferenceDescriptor: {
          id: eventId,
          title: openPlannerSchedule.title,
          description: descriptor.description,
          peopleDescription: descriptor.peopleDescription || '500',
          timezone: openPlannerSchedule.timezone,
          logoUrl: openPlannerSchedule.logoUrl,
          backgroundUrl: openPlannerSchedule.backgroundUrl,
          headingTitle: openPlannerSchedule.headingTitle,
          talkFormats: openPlannerSchedule.talkFormats,
          talkTracks: openPlannerSchedule.talkTracks,
          supportedTalkLanguages: openPlannerSchedule.supportedTalkLanguages,
          rooms: openPlannerSchedule.rooms,
          days: descriptor.days,
          keywords: descriptor.keywords,
          location: descriptor.location,
          websiteUrl: descriptor.websiteUrl,
          theming: descriptor.theming,
          features: {
            ...openPlannerSchedule.features,
            ratings: descriptor.ratings
          }
        },
        daySchedules: dailySchedules,
        talks,
        info: {
          id: eventId,
          title: openPlannerSchedule.title,
          description: descriptor.description,
          peopleDescription: descriptor.peopleDescription || '500',
          timezone: openPlannerSchedule.timezone,
          days: descriptor.days,
          logoUrl: openPlannerSchedule.logoUrl,
          backgroundUrl: openPlannerSchedule.backgroundUrl,
          websiteUrl: descriptor.infos?.socialMedias?.find(sm => sm.type === 'website')?.href || "",
          location: descriptor.location,
          theming: descriptor.theming,
          keywords: descriptor.keywords
        }
      }

      return event
    }
};

export default OPENPLANNER_CRAWLER;
