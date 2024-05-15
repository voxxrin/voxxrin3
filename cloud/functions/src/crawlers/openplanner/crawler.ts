import {BreakTimeslotWithPotentiallyUnknownIcon, FullEvent} from "../../models/Event";
import {z} from "zod";
import {
  EVENT_DESCRIPTOR_PARSER,
  EVENT_FEATURES_CONFIG_PARSER,
  FORMATTINGS_CONFIG_PARSER,
  RATINGS_CONFIG_PARSER
} from "../crawler-parsers";
import {CrawlerKind, TALK_TRACK_FALLBACK_COLORS} from "../crawl";
import {ISO_DATETIME_PARSER} from "../../utils/zod-parsers";
import {
  DailySchedule,
  DetailedTalk, Room,
  ScheduleTimeSlot, Speaker,
  Talk, TalkFormat, TalksTimeSlot, ThemedTrack,
} from "../../../../../shared/daily-schedule.firestore";
import {match, P} from "ts-pattern";
import {Temporal} from "@js-temporal/polyfill";
import {ISODatetime} from "../../../../../shared/type-utils";
import {fillUnknownBreakIcons} from "../utils";

export const OPENPLANNER_DESCRIPTOR_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
  id: true,
  days: true,
  theming: true,
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
  ratings: RATINGS_CONFIG_PARSER,
})

export const OPENPLANNER_GENERATED_SCHEDULE_PARSER = EVENT_DESCRIPTOR_PARSER.omit({
  id: true,
  description: true,
  keywords: true,
  location: true,
  websiteUrl: true,
  formattings: true,
  features: true,
}).extend({
  features: EVENT_FEATURES_CONFIG_PARSER.omit({ ratings: true }).extend({
  }),
  sessions: z.record(z.string(), z.object({
    speakers: z.array(z.string()),
    tags: z.array(z.string()),
    title: z.string(),
    id: z.string(),
    categoryName: z.string().nullish(),
    categoryId: z.string().nullish(), // talkTrack
    formatId: z.string().nullish(), // talkFormat
    abstract: z.string().nullish(),
    trackId: z.string(), // room
    trackTitle: z.string(),
    startTime: ISO_DATETIME_PARSER.optional(),
    endTime: ISO_DATETIME_PARSER.optional(),
  })),
  speakers: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    photoUrl: z.string(),
    socials: z.array(z.object({
      icon: z.union([z.literal("twitter"), z.literal("linkedin"), z.literal("github")]),
      link: z.string(),
      name: z.union([z.literal("LinkedIn"), z.literal("Linkedin"), z.literal("Twitter"), z.literal("GitHub")]),
    })),
    bio: z.string().nullish(),
    company: z.string()
  }))
})

export const OPENPLANNER_CRAWLER: CrawlerKind<typeof OPENPLANNER_DESCRIPTOR_PARSER> = {
    descriptorParser: OPENPLANNER_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof OPENPLANNER_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }) => {

      console.info(`Crawling openplanner JSON file: ${descriptor.openPlannerGeneratedJson}`)
      const openPlannerSchedule = await fetch(descriptor.openPlannerGeneratedJson)
        .then(resp => resp.json())
        .then(data => OPENPLANNER_GENERATED_SCHEDULE_PARSER.parse(data));

      const talks: DetailedTalk[] = [],
        tracks: ThemedTrack[] = openPlannerSchedule.talkTracks,
        formats: TalkFormat[] = openPlannerSchedule.talkFormats,
        rooms: Room[] = openPlannerSchedule.rooms,
        timezone = openPlannerSchedule.timezone;

      const speakers = Object.values(openPlannerSchedule.speakers).map(openPlannerSpeaker => {
        const speaker: Speaker = {
          id: openPlannerSpeaker.id,
          fullName: openPlannerSpeaker.name,
          bio: openPlannerSpeaker.bio,
          photoUrl: openPlannerSpeaker.photoUrl,
          companyName: openPlannerSpeaker.company,
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

      let trackFallbackColors = 0
      const UNKNOWN_TRACK_ID = 'unknown'
      // Auto-appending an 'unknown' track as openplanner's category might be nullable (ex: on sunnytech, for keynotes)
      // => in that case, we'll use this special 'unknown' track name
      tracks.push({
        id: UNKNOWN_TRACK_ID,
        title: 'Unknown',
        themeColor: TALK_TRACK_FALLBACK_COLORS[trackFallbackColors++]
      })

      const dailySchedules = openPlannerSchedule.days.map((day, dayIndex) => {
        const dailyRawSessions = Object.values(openPlannerSchedule.sessions)
          .filter(session => session.startTime && session.endTime && session.startTime.startsWith(day.localDate))

        const { talkTimeslots, breakTimeslots: breakTimeslotsWithPotentiallyUnknownIcons } = dailyRawSessions.reduce(({talkTimeslots, breakTimeslots}, session) => {
          const startInstant = Temporal.Instant.from(session.startTime!);
          const endInstant = Temporal.Instant.from(session.endTime!);

          const start = startInstant.toString() as ISODatetime,
            end = endInstant.toString() as ISODatetime;

          const timeslotId = `${start}--${end}` as const

          const room = match(rooms.find(r => r.id === session.trackId))
            .with(P.nullish, () => {
              const newRoom: Room = {
                id: session.trackId,
                title: session.trackTitle
              }
              rooms.push(newRoom);
              console.warn(`Room with id ${session.trackId} (in talk ${session.id}) was not found in rooms' list !.. Created it !`)
              return newRoom;
            }).otherwise(room => room)

          if(!session.formatId) {
            const breakSlot: BreakTimeslotWithPotentiallyUnknownIcon = {
              type: 'break',
              start, end,
              id: timeslotId,
              break: {
                title: session.title,
                room,
                icon: 'unknown' as const
              }
            }
            breakTimeslots.push(breakSlot);
          } else {
            const track: ThemedTrack = match(tracks.find(t => t.id === (session.categoryId || UNKNOWN_TRACK_ID)))
              .with(P.nullish, () => {
                if(!session.categoryId || !session.categoryName) {
                  throw new Error(`Detected a falsey session category id/name for session ${session.id}: aborting as this is truely unexpected as this should have been handled through 'unknown' auto-added track`)
                }
                const newTrack: ThemedTrack = {
                  id: session.categoryId,
                  title: session.categoryName,
                  themeColor: TALK_TRACK_FALLBACK_COLORS[trackFallbackColors++]
                }

                tracks.push(newTrack);
                console.warn(`Track with id ${session.categoryId} (in talk ${session.id}) was not found in tracks' list !.. Created it !`)
                return newTrack;
              }).otherwise(track => track)

            const format = match(formats.find(f => f.id === session.formatId))
              .with(P.nullish, () => {
                const talkDurationInMinutes = startInstant.until(endInstant).total('minutes')
                const formatDuration = `PT${talkDurationInMinutes}m` as const;

                const newFormat: TalkFormat = {
                  id: `talk-${formatDuration}m`,
                  title: `Talk de ${formatDuration}m`,
                  duration: formatDuration
                }
                formats.push(newFormat)
                console.warn(`Format with id ${session.formatId} (in talk ${session.id}) was not found in formats' list !.. Created it !`)
                return newFormat;
              }).otherwise(format => format)

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
              start, end,
              tags: session.tags,
              assets: [],
              description: session.abstract || "",
              summary: session.abstract || "",
            }

            talks.push(detailedTalk);

            const talksTimeslot = match(talkTimeslots.find(ts => ts.id === timeslotId))
              .with(P.nullish, () => {
                const talksTimeslot: TalksTimeSlot = {
                  id: timeslotId,
                  start: detailedTalk.start,
                  end: detailedTalk.end,
                  type: 'talks',
                  talks: []
                }

                talkTimeslots.push(talksTimeslot);
                return talksTimeslot;
              }).with({ type: 'talks'}, (talksTimeslot) => talksTimeslot)
              .otherwise((ts) => { throw new Error(`Unsupported case for timeslot: ${JSON.stringify(ts)}`)})

            talksTimeslot.talks.push(talk);
          }

          return { talkTimeslots, breakTimeslots };
        }, {talkTimeslots: [], breakTimeslots: []} as {talkTimeslots: TalksTimeSlot[], breakTimeslots: BreakTimeslotWithPotentiallyUnknownIcon[] })

        const breakTimeslots = fillUnknownBreakIcons(
          { isFirst: dayIndex === 0, isLast: dayIndex === openPlannerSchedule.days.length-1 },
          timezone, breakTimeslotsWithPotentiallyUnknownIcons, talkTimeslots);

        const dailySchedule: DailySchedule = {
          day: day.id,
          timeSlots: ([] as ScheduleTimeSlot[]).concat(...breakTimeslots).concat(...talkTimeslots)
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
          timezone,
          logoUrl: openPlannerSchedule.logoUrl,
          backgroundUrl: openPlannerSchedule.backgroundUrl,
          headingTitle: openPlannerSchedule.headingTitle,
          talkFormats: openPlannerSchedule.talkFormats,
          talkTracks: openPlannerSchedule.talkTracks,
          supportedTalkLanguages: openPlannerSchedule.supportedTalkLanguages,
          rooms: openPlannerSchedule.rooms,
          days: openPlannerSchedule.days,
          keywords: descriptor.keywords,
          location: descriptor.location,
          theming: openPlannerSchedule.theming,
          features: {
            ...openPlannerSchedule.features,
            ratings: descriptor.ratings
          },
          formattings: descriptor.formattings || {
            talkFormatTitle: 'with-duration'
          },
        },
        daySchedules: dailySchedules,
        talks,
        info: {
          id: eventId,
          title: openPlannerSchedule.title,
          description: descriptor.description,
          peopleDescription: descriptor.peopleDescription || '500',
          timezone,
          days: openPlannerSchedule.days,
          logoUrl: openPlannerSchedule.logoUrl,
          backgroundUrl: openPlannerSchedule.backgroundUrl,
          location: descriptor.location,
          theming: openPlannerSchedule.theming,
          keywords: descriptor.keywords
        }
      }

      return event
    }
};

export default OPENPLANNER_CRAWLER;
