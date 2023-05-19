import {z} from "zod";
import {FullEvent} from "../models/Event";

export type CrawlerKind<ZOD_TYPE extends z.ZodType> = {
    kind: string,
    crawlerImpl: (eventId: string, crawlerDescriptor: z.infer<ZOD_TYPE>) => Promise<FullEvent>,
    descriptorParser: ZOD_TYPE
}

export const FIREBASE_CRAWLER_DESCRIPTOR_PARSER = z.object({
    kind: z.string(),
    descriptorUrl: z.string(),
    crawl: z.boolean()
})

export const FULL_DESCRIPTOR_PARSER = z.object({
    title: z.string(),
    headingTitle: z.string(),
    description: z.string(),
    days: z.array(z.object({
        id: z.string(), localDate: z.string().regex(/\d{4}-\d{2}-\d{2}/)
    })),
    timezone: z.string(),
    keywords: z.array(z.string()),
    location: z.object({
        country: z.string(), city: z.string()
    }),
    features: z.object({
        roomsDisplayed: z.boolean(),
        favoritesEnabled: z.boolean(),
        remindMeOnceVideosAreAvailableEnabled: z.boolean(),
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
                max: z.number()
            }),
            'free-text': z.object({
                enabled: z.boolean(),
                maxLength: z.number()
            }),
            'custom-scale': z.object({
                enabled: z.boolean(),
                choices: z.array(z.object({
                    id: z.string(),
                    icon: z.enum(['smiling_face', 'neutral_face', 'confused_face'])
                }))
            })
        })
    }),
    supportedTalkLanguages: z.array(z.object({
        id: z.string(),
        label: z.string(),
        themeColor: z.string()
    })),
    talkFormats: z.array(z.object({
        id: z.string(),
        title: z.string(),
        duration: z.string().regex(/PT\d+m/),
        themeColor: z.string(),
    })),
    talkTracks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        themeColor: z.string()
    })),
    rooms: z.array(z.object({
        id: z.string(),
        title: z.string()
    })),
    theming: z.object({
        colors: z.object({
            primaryHex: z.string(),
            primaryContrastHex: z.string(),
            secondaryHex: z.string(),
            secondaryContrastHex: z.string(),
            tertiaryHex: z.string(),
            tertiaryContrastHex: z.string(),
        })
    }),
    infos: z.object({
        venuePicture: z.string(),
        eventDescription: z.string()
    }),
    logoUrl: z.string(),
    backgroundUrl: z.string(),
    websiteUrl: z.string(),
    peopleDescription: z.string().nullable(),
})
