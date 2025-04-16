import {BreakTimeslotWithPotentiallyUnknownIcon, FullEvent} from "../../models/Event";
import {z} from "zod";
import {
  BREAK_PARSER,
  BREAK_TIME_SLOT_PARSER,
  EVENT_DESCRIPTOR_PARSER,
  EVENT_FEATURES_CONFIG_PARSER, EVENT_THEME_PARSER,
  RATINGS_CONFIG_PARSER, ROOM_PARSER,
  SPEAKER_PARSER,
  TALK_PARSER,
  TALKS_TIME_SLOT_PARSER, THEMABLE_LANGUAGE_PARSER,
  THEMABLE_TALK_FORMAT_PARSER,
  THEMABLE_TALK_TRACK_PARSER
} from "../crawler-parsers";
import {CrawlerKind, TALK_FORMAT_FALLBACK_COLORS, TALK_TRACK_FALLBACK_COLORS} from "../crawl";
import {ISO_DATETIME_PARSER} from "../../utils/zod-parsers";
import {
  DailySchedule,
  DetailedTalk,
  Room,
  ScheduleTimeSlot,
  Speaker,
  Talk,
  TalkFormat,
  TalksTimeSlot, ThemedTalkFormat,
  ThemedTrack,
} from "@shared/daily-schedule.firestore";
import {match, P} from "ts-pattern";
import {Temporal} from "@js-temporal/polyfill";
import {ISODatetime} from "@shared/type-utils";
import {fillUnknownBreakIcons} from "../utils";

const OPENPLANNER_SESSION_PARSER = z.object({
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
    type: z.literal('undefined').optional().default('undefined'),
  });

const OPENPLANNER_SPEAKER_PARSER = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string().optional(),
  socials: z.array(z.object({
    icon: z.union([z.literal(""), z.literal("site"), z.literal("twitter"), z.literal("linkedin"), z.literal("github")]),
    link: z.string(),
    name: z.string().optional(),
  })),
  bio: z.string().nullish(),
  company: z.string().nullish()
})

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
  title: z.string().optional(),
  headingTitle: z.string().optional(),
  backgroundUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  theming: EVENT_THEME_PARSER.optional(),
  features: EVENT_FEATURES_CONFIG_PARSER.omit({ ratings: true }).optional(),
  talkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER).default([]),
  talkTracks: z.array(THEMABLE_TALK_TRACK_PARSER).default([]),
  language: z.string(),
  ratings: RATINGS_CONFIG_PARSER,
  additionalBreakTimeslots: z.array(BREAK_TIME_SLOT_PARSER.omit({ type: true, id: true })).optional().default([]),
  additionalSessions: z.record(z.string(), OPENPLANNER_SESSION_PARSER
    .omit({ type: true })
    .extend({
      type: z.literal('talk').optional().default('talk')
    })).optional().default({}),
  additionalSpeakers: z.record(z.string(), OPENPLANNER_SPEAKER_PARSER).optional().default({}),
  additionalTalkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER).optional().default([]),
  additionalTalkTracks: z.array(THEMABLE_TALK_TRACK_PARSER).optional().default([]),
  additionalRooms: z.array(ROOM_PARSER).optional().default([]),
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
  sessions: z.record(z.string(), OPENPLANNER_SESSION_PARSER),
  speakers: z.record(z.string(), OPENPLANNER_SPEAKER_PARSER),
})

export const OPENPLANNER_CRAWLER: CrawlerKind<typeof OPENPLANNER_DESCRIPTOR_PARSER> = {
    descriptorParser: OPENPLANNER_DESCRIPTOR_PARSER,
    crawlerImpl: async (eventId: string, descriptor: z.infer<typeof OPENPLANNER_DESCRIPTOR_PARSER>, criteria: { dayIds?: string[]|undefined }) => {

      console.info(`Crawling openplanner JSON file: ${descriptor.openPlannerGeneratedJson}`)
      const openPlannerSchedule = await fetch(descriptor.openPlannerGeneratedJson)
        .then(resp => resp.json())
        .then(data => OPENPLANNER_GENERATED_SCHEDULE_PARSER.parse(data));

      const talks: DetailedTalk[] = [],
        tracks: ThemedTrack[] = descriptor.talkTracks.concat(openPlannerSchedule.talkTracks).concat(descriptor.additionalTalkTracks),
        formats: ThemedTalkFormat[] = descriptor.talkFormats.concat(openPlannerSchedule.talkFormats).concat(descriptor.additionalTalkFormats),
        rooms: Room[] = openPlannerSchedule.rooms.concat(descriptor.additionalRooms),
        timezone = openPlannerSchedule.timezone;

      const speakers = Object.values({ ...openPlannerSchedule.speakers, ...descriptor.additionalSpeakers }).map(openPlannerSpeaker => {
        const speaker: Speaker = {
          id: openPlannerSpeaker.id,
          fullName: openPlannerSpeaker.name,
          bio: openPlannerSpeaker.bio || null,
          photoUrl: openPlannerSpeaker.photoUrl || null,
          companyName: openPlannerSpeaker.company || null,
          social: openPlannerSpeaker.socials.map(opSocial => {
            const type = match([opSocial.icon, opSocial.name])
              .with(['github', P.any], () => 'github' as const)
              .with(['linkedin', P.any], () => 'linkedin' as const)
              .with(['twitter', P.any], () => 'twitter' as const)
              .with(['site', P.any], () => 'website' as const)
              .with(['', P.union("Twitter", "twitter")], () => 'twitter' as const)
              .with(['', P.union("Linkedin", "linkedin", "LinkedIn")], () => 'linkedin' as const)
              .with(['', P.union("Github", "github", "GitHub")], () => 'github' as const)
              .otherwise(() => undefined);

            return (type && opSocial.link) ? {type, url: opSocial.link } : undefined;
          }).filter(s => !!s).map(s => s!),
        }
        return speaker;
      })

      let trackFallbackColors = 0, formatFallbackColors = 0;
      const UNKNOWN_TRACK_ID = 'unknown'
      // Auto-appending an 'unknown' track as openplanner's category might be nullable (ex: on sunnytech, for keynotes)
      // => in that case, we'll use this special 'unknown' track name
      tracks.push({
        id: UNKNOWN_TRACK_ID,
        title: 'Unknown',
        themeColor: TALK_TRACK_FALLBACK_COLORS[trackFallbackColors++]
      })

      const dailySchedules = openPlannerSchedule.days.map((day, dayIndex) => {
        const dailyRawSessions = Object.values({ ...openPlannerSchedule.sessions, ...descriptor.additionalSessions })
          .filter(session => session.startTime && session.endTime && session.startTime.startsWith(day.localDate))

        const { talkTimeslots, breakTimeslots: breakTimeslotsWithPotentiallyUnknownIcons } = dailyRawSessions.reduce(({talkTimeslots, breakTimeslots}, session) => {
          const startInstant = Temporal.Instant.from(session.startTime!);
          const endInstant = Temporal.Instant.from(session.endTime!);

          const start = startInstant.toString() as ISODatetime,
            end = endInstant.toString() as ISODatetime;

          const timeRangeId = `${start}--${end}` as const

          const room = match(rooms.find(r => r.id === session.trackId)) // track is room in openplanner
            .with(P.nullish, () => {
              const newRoom: Room = {
                id: session.trackId,
                title: session.trackTitle
              }
              rooms.push(newRoom);
              console.warn(`Room with id ${session.trackId} (in talk ${session.id}) was not found in rooms' list !.. Created it !`)
              return newRoom;
            }).otherwise(room => room)

          if(!session.formatId && session.type !== 'talk') {
            const breakSlot: BreakTimeslotWithPotentiallyUnknownIcon = {
              type: 'break',
              start, end,
              id: `${timeRangeId}--${room.id}`,
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

                const newFormat: ThemedTalkFormat = {
                  id: `talk-${formatDuration}m`,
                  title: `Talk de ${talkDurationInMinutes}m`,
                  duration: formatDuration,
                  themeColor: TALK_FORMAT_FALLBACK_COLORS[formatFallbackColors++],
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

            const talksTimeslot = match(talkTimeslots.find(ts => ts.id === timeRangeId))
              .with(P.nullish, () => {
                const talksTimeslot: TalksTimeSlot = {
                  id: timeRangeId,
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
          timezone, breakTimeslotsWithPotentiallyUnknownIcons, talkTimeslots)
          .concat((descriptor.additionalBreakTimeslots || []).map(partialTimeslot => ({
            ...partialTimeslot,
            id: `${partialTimeslot.start as ISODatetime}--${partialTimeslot.end as ISODatetime}--${partialTimeslot.break.room.id}`,
            type: 'break'
          })))

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
          title: descriptor.title || openPlannerSchedule.title,
          description: descriptor.description,
          peopleDescription: descriptor.peopleDescription || '',
          timezone,
          logoUrl: descriptor.logoUrl || openPlannerSchedule.logoUrl,
          backgroundUrl: descriptor.backgroundUrl || openPlannerSchedule.backgroundUrl,
          headingTitle: descriptor.headingTitle || openPlannerSchedule.headingTitle,
          headingSubTitle: descriptor.headingSubTitle || openPlannerSchedule.headingSubTitle,
          headingBackground: descriptor.headingBackground || openPlannerSchedule.headingBackground,
          talkFormats: formats,
          talkTracks: tracks,
          supportedTalkLanguages: openPlannerSchedule.supportedTalkLanguages,
          rooms: rooms,
          days: openPlannerSchedule.days,
          keywords: descriptor.keywords,
          location: descriptor.location,
          theming: descriptor.theming || openPlannerSchedule.theming,
          features: {
            ...(descriptor.features || openPlannerSchedule.features),
            ratings: descriptor.ratings
          },
          formattings: descriptor.formattings || {
            talkFormatTitle: 'with-duration',
            parseMarkdownOn: [],
          },
        },
        daySchedules: dailySchedules,
        talks,
        info: {
          id: eventId,
          title: descriptor.title || openPlannerSchedule.title,
          description: descriptor.description,
          peopleDescription: descriptor.peopleDescription || '',
          timezone,
          days: openPlannerSchedule.days,
          logoUrl: descriptor.logoUrl || openPlannerSchedule.logoUrl,
          backgroundUrl: descriptor.backgroundUrl || openPlannerSchedule.backgroundUrl,
          location: descriptor.location,
          theming: descriptor.theming || openPlannerSchedule.theming,
          keywords: descriptor.keywords
        }
      }

      return event
    }
};

export default OPENPLANNER_CRAWLER;
