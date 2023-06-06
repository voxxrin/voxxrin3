import {z, ZodLiteral} from "zod";
import {ISODatetime, ISOLocalDate} from "../../../../shared/type-utils";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";


export const HEX_COLOR_PARSER = z.string().regex(/#[0-9a-fA-F]{6}/gi) as unknown as ZodLiteral<`#${string}`>
export const DURATION_PARSER = z.string().regex(/PT\d+m/gi) as unknown as ZodLiteral<`PT${number}m`>
export const ISO_LOCAL_DATE_PARSER = z.string().regex(/\d{4}-\d{2}-\d{2}/gi) as unknown as ZodLiteral<ISOLocalDate>
export const ISO_DATETIME_PARSER = z.string().regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|(?:[+-]\d{2}:\d{2}))/gi) as unknown as ZodLiteral<ISODatetime>

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

export const LISTABLE_EVENT_PARSER = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullish(),
    days: z.array(DAY_PARSER),
    timezone: z.string(),
    keywords: z.array(z.string()),
    location: z.object({
        country: z.string(),
        city: z.string(),
    }),
    peopleDescription: z.string().nullish(),
    backgroundUrl: z.string(),
    logoUrl: z.string(),
    websiteUrl: z.string(),
    theming: EVENT_THEME_PARSER,
})

export const EVENT_DESCRIPTOR_PARSER = LISTABLE_EVENT_PARSER.extend({
    headingTitle: z.string(),
    features: z.object({
        roomsDisplayed: z.boolean(),
        favoritesEnabled: z.boolean(),
        remindMeOnceVideosAreAvailableEnabled: z.boolean(),
        // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
        hideLanguages: z.array(z.string()),
        ratings: z.object({
            bingo: z.object({
                enabled: z.boolean(),
                choices: z.array(z.object({
                    id: z.string(),
                    label: z.string()
                }))
            }),
            scale: z.object({
                enabled: z.boolean(),
                icon: z.enum(['star', 'thumbs-up']),
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
                    icon: z.enum(["happy", "sad", "thumbs-up", "hand-right", "thumbs-down"])
                }))
            })
        }),
    }),
    talkFormats: z.array(THEMABLE_TALK_FORMAT_PARSER),
    talkTracks: z.array(THEMABLE_TALK_TRACK_PARSER),
    supportedTalkLanguages: z.array(THEMABLE_LANGUAGE_PARSER),
    rooms: z.array(ROOM_PARSER),
    infos: z.object({
        venuePicture: z.string(),
        eventDescription: z.string()
    })
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
        type: z.union([
            z.literal('twitter'),
            z.literal('linkedin'),
            z.literal('mastodon'),
            z.literal('instagram'),
            z.literal('youtube'),
            z.literal('twitch'),
        ]),
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
    description: z.string()
})

export const TIME_SLOT_BASE_PARSER = z.object({
    start: ISO_DATETIME_PARSER,
    end: ISO_DATETIME_PARSER,
    id: z.string()
})

export const BREAK_PARSER = z.object({
    icon: z.union([
        z.literal('ticket'),
        z.literal('restaurant'),
        z.literal('cafe'),
        z.literal('beer'),
        z.literal('film'),
        z.literal('train'),
    ]),
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
    kind: z.string(),
    descriptorUrl: z.string(),
    crawl: z.boolean()
})
