import {z, ZodLiteral} from "zod";
import {ISOLocalDate, ISOZonedTime} from "../../../../shared/type-utils";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";
import {ScheduleTimeSlot} from "../../../../shared/daily-schedule.firestore";
import {ISO_DATETIME_PARSER} from "../utils/zod-parsers";


export const HEX_COLOR_PARSER = z.string().regex(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?/gi) as unknown as ZodLiteral<`#${string}`>
export const DURATION_PARSER = z.string().regex(/PT\d+m/gi) as unknown as ZodLiteral<`PT${number}m`>
export const ISO_LOCAL_DATE_PARSER = z.string().regex(/\d{4}-\d{2}-\d{2}/gi) as unknown as ZodLiteral<ISOLocalDate>
export const TIMESLOT_ID_PARSER = z.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|(?:[+-]\d{2}:\d{2}))--\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|(?:[+-]\d{2}:\d{2}))/gi) as unknown as ZodLiteral<ScheduleTimeSlot['id']>
export const TIME_PARSER = z.string().regex(/\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|(?:[+-]\d{2}:\d{2}))/gi) as unknown as ZodLiteral<ISOZonedTime>;

export const DAY_PARSER = z.object({
    id: z.string(),
    localDate: ISO_LOCAL_DATE_PARSER
});

export const TALK_FORMAT_PARSER = z.object({
    id: z.string(),
    title: z.string(),
    duration: DURATION_PARSER,
});

export const THEMABLE_TALK_FORMAT_PARSER = TALK_FORMAT_PARSER.extend({
    themeColor: HEX_COLOR_PARSER
});

export const ROOM_PARSER = z.object({
    id: z.string(),
    title: z.string()
})

export const TALK_TRACK_PARSER = z.object({
    id: z.string(),
    title: z.string(),
})
export const THEMABLE_TALK_TRACK_PARSER = TALK_TRACK_PARSER.extend({
    themeColor: HEX_COLOR_PARSER
})

export const THEMABLE_LANGUAGE_PARSER = z.object({
    id: z.string(),
    label: z.string(),
    themeColor: HEX_COLOR_PARSER
})

export const EVENT_THEME_PARSER = z.object({
    colors: z.object({
        primaryHex: HEX_COLOR_PARSER,
        primaryContrastHex: HEX_COLOR_PARSER,
        secondaryHex: HEX_COLOR_PARSER,
        secondaryContrastHex: HEX_COLOR_PARSER,
        tertiaryHex: HEX_COLOR_PARSER,
        tertiaryContrastHex: HEX_COLOR_PARSER
    })
})

export const SOCIAL_MEDIA_TYPE = z.union([
    z.literal('website'),
    z.literal('twitter'),
    z.literal('linkedin'),
    z.literal('mastodon'),
    z.literal('instagram'),
    z.literal('youtube'),
    z.literal('twitch'),
    z.literal('github'),
    z.literal('facebook'),
    z.literal('flickr'),
])

export const LISTABLE_EVENT_PARSER = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    days: z.array(DAY_PARSER),
    timezone: z.string(),
    keywords: z.array(z.string()),
    location: z.object({
        country: z.string(),
        city: z.string(),
        coords: z.object({
          latitude: z.number(),
          longitude: z.number()
        }).optional(),
        address: z.string().optional(),
    }),
    peopleDescription: z.string().nullish().optional(),
    backgroundUrl: z.string(),
    logoUrl: z.string(),
    websiteUrl: z.string(),
    theming: EVENT_THEME_PARSER,
})

export const INFOS_PARSER = z.object({
    floorPlans: z.array(z.object({
        label: z.string(), pictureUrl: z.string()
    })).optional(),
    socialMedias: z.array(z.object({
        type: SOCIAL_MEDIA_TYPE,
        href: z.string()
    })).optional(),
    sponsors: z.array(z.object({
        type: z.string(), typeColor: z.string(), typeFontColor: z.string().optional(),
        sponsorships: z.array(z.object({
            name: z.string(), logoUrl: z.string(), href: z.string()
        }))
    })).optional(),
});

export const RECORDING_CONFIG_PARSER = z.object({
  platform: z.literal('youtube'),
  youtubeHandle: z.string(),
  recordedFormatIds: z.array(z.string()).optional(),
  notRecordedFormatIds: z.array(z.string()).optional(),
  recordedRoomIds: z.array(z.string()).optional(),
  notRecordedRoomIds: z.array(z.string()).optional(),
  ignoreVideosPublishedAfter: ISO_LOCAL_DATE_PARSER.optional(),
  excludeTitleWordsFromMatching: z.array(z.string()).optional(),
})

export const RATINGS_CONFIG_PARSER = z.object({
  bingo: z.object({
    enabled: z.boolean(),
    choices: z.array(z.object({
      id: z.string(),
      label: z.string()
    }))
  }),
  scale: z.object({
    enabled: z.boolean(),
    icon: z.union([z.literal('star'), z.literal('thumbs-up')]),
    labels: z.array(z.string())
      .transform(arr => arr as ConferenceDescriptor['features']['ratings']['scale']['labels'])
  }),
  'free-text': z.object({
    enabled: z.boolean(),
    maxLength: z.number()
  }),
  'custom-scale': z.object({
    enabled: z.boolean(),
    choices: z.array(z.object({
      id: z.string(),
      icon: z.union([
        z.literal("happy"),
        z.literal("sad"),
        z.literal("thumbs-up"),
        z.literal("hand-right"),
        z.literal("thumbs-down")
      ])
    }))
  })
});

export const FORMATTINGS_CONFIG_PARSER = z.object({
  talkFormatTitle: z.union([z.literal('with-duration'), z.literal('without-duration')])
})

export const EVENT_FEATURES_CONFIG_PARSER = z.object({
  roomsDisplayed: z.boolean(),
  favoritesEnabled: z.boolean(),
  remindMeOnceVideosAreAvailableEnabled: z.boolean(),
  showInfosTab: z.boolean().optional(),
  // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
  hideLanguages: z.array(z.string()),
  showRoomCapacityIndicator: z.boolean().optional(),
  ratings: RATINGS_CONFIG_PARSER,
  topRatedTalks: z.object({
    minimumNumberOfRatingsToBeConsidered: z.number(),
    minimumAverageScoreToBeConsidered: z.number().optional(),
    numberOfDailyTopTalksConsidered: z.number()
  }).optional(),
  recording: RECORDING_CONFIG_PARSER.optional(),
})

export const EVENT_DESCRIPTOR_PARSER = LISTABLE_EVENT_PARSER.extend({
    headingTitle: z.string(),
    features: EVENT_FEATURES_CONFIG_PARSER,
    talkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER),
    talkTracks: z.array(THEMABLE_TALK_TRACK_PARSER),
    supportedTalkLanguages: z.array(THEMABLE_LANGUAGE_PARSER),
    rooms: z.array(ROOM_PARSER),
    infos: INFOS_PARSER.optional(),
    formattings: FORMATTINGS_CONFIG_PARSER.optional(),
})

export const DAILY_TALKS_STATS_PARSER = z.object({
    day: z.string(),
    stats: z.array(z.object({
        id: z.string(),
        totalFavoritesCount: z.number()
    }))
})

export const SPEAKER_PARSER = z.object({
    photoUrl: z.string().nullish(),
    companyName: z.string().nullish(),
    fullName: z.string(),
    id: z.string(),
    bio: z.string().nullish(),
    social: z.array(z.object({
        type: SOCIAL_MEDIA_TYPE,
        url: z.string()
    }))
})

export const TALK_PARSER = z.object({
    speakers: z.array(SPEAKER_PARSER),
    format: TALK_FORMAT_PARSER,
    language: z.string(),
    id: z.string(),
    title: z.string(),
    track: TALK_TRACK_PARSER,
    room: ROOM_PARSER
})

export const DETAILED_TALK_PARSER =  TALK_PARSER.extend({
    start: ISO_DATETIME_PARSER,
    end: ISO_DATETIME_PARSER,
    summary: z.string(),
    description: z.string(),
    tags: z.array(z.string())
})

export const TIME_SLOT_BASE_PARSER = z.object({
    start: ISO_DATETIME_PARSER,
    end: ISO_DATETIME_PARSER,
    id: TIMESLOT_ID_PARSER
})

export const BREAK_ICON_PARSER = z.union([
  z.literal('ticket'),
  z.literal('restaurant'),
  z.literal('cafe'),
  z.literal('beer'),
  z.literal('movie'),
  z.literal('wallet'),
])

export const BREAK_PARSER = z.object({
    icon: BREAK_ICON_PARSER,
    title: z.string(),
    room: ROOM_PARSER
})

export const BREAK_TIME_SLOT_PARSER = TIME_SLOT_BASE_PARSER.extend({
    type: z.literal('break'),
    break: BREAK_PARSER
})
export const TALKS_TIME_SLOT_PARSER = TIME_SLOT_BASE_PARSER.extend({
    type: z.literal('talks'),
    talks: z.array(TALK_PARSER)
})

export const SCHEDULE_TIME_SLOT_PARSER = z.discriminatedUnion('type', [
    BREAK_TIME_SLOT_PARSER,
    TALKS_TIME_SLOT_PARSER
]);

export const DAILY_SCHEDULE_PARSER = z.object({
    day: z.string(),
    timeSlots: z.array(SCHEDULE_TIME_SLOT_PARSER)
})

export const FULL_EVENT_PARSER = z.object({
    id: z.string(),
    conferenceDescriptor: EVENT_DESCRIPTOR_PARSER,
    info: LISTABLE_EVENT_PARSER,
    daySchedules: z.array(DAILY_SCHEDULE_PARSER),
    talks: z.array(DETAILED_TALK_PARSER)
})

export const FIREBASE_CRAWLER_DESCRIPTOR_PARSER = z.object({
    // TODO: to remove
    legacyCrawlingKeys: z.array(z.string()).optional(),
    eventFamily: z.string(),
    eventName: z.string(),
    descriptorUrl: z.string(),
    kind: z.string(),
})
