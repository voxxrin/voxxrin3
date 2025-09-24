import {z, ZodType} from "zod";
import {FullEvent} from "../../models/Event";
import {
  createColDescriptor, createDescriptor,
  GSheetDescriptors,
  GSheetReader
} from "./gsheet-reader";
import { match, P } from "ts-pattern";
import {HexColor, ISODatetime, ISODuration, ISOLocalDate} from "@shared/type-utils";
import {
  DURATION_IN_MINUTES_PARSER,
  HEX_COLOR_PARSER,
  ISO_LOCAL_DATE_PARSER,
  SOCIAL_MEDIA_TYPE
} from "../crawler-parsers";
import {logger} from "firebase-functions";
import {
  Speaker, SocialLink,
} from "@shared/daily-schedule.firestore";
import {Talk} from "@shared/daily-schedule.firestore";
import {fillBreakIcons, toTimezoneOffsettedDateTime} from "../utils";
import {Temporal} from "@js-temporal/polyfill";


const GSHEETS_EVENT_DESCRIPTORS = {
  mainDescription: createDescriptor({
    sheetName: "Event description",
    firstRowIsHeader: true,
    minRow: 1, maxRow: 12,
    cols: createColDescriptor({name: 'A', value: 'B?',}),
    ignoreRowWhen: (rowType) => !rowType.name,
  }),
  eventLocation: createDescriptor({
    sheetName: "Event description",
    firstRowIsHeader: true,
    minRow: 13, maxRow: 20,
    cols: createColDescriptor({name: 'A', value: 'B',} as const),
    ignoreRowWhen: (rowType) => !rowType.name
  }),
  theming: createDescriptor({
    sheetName: "Event description",
    firstRowIsHeader: true,
    minRow: 21, maxRow: 29,
    cols: createColDescriptor({colorName: 'A', color: 'B',}),
    ignoreRowWhen: (rowType) => !rowType.colorName
  }),
  socialMedia: createDescriptor({
    sheetName: "Event description",
    firstRowIsHeader: true,
    minRow: 30,
    cols: createColDescriptor({socialMediaName: 'A', href: 'B?',}),
    ignoreRowWhen: (rowType) => !rowType.socialMediaName
  }),
  days: createDescriptor({
    sheetName: "Event description",
    firstRowIsHeader: true,
    minRow: 2, maxRow: 17,
    cols: createColDescriptor({id: 'E', localDate: {col: 'F', parser: ISO_LOCAL_DATE_PARSER },}),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  floorPlans: createDescriptor({
    sheetName: "Event description",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({label: 'I', pictureUrl: 'J',}),
    ignoreRowWhen: (rowType) => !rowType.label
  }),
  features: createDescriptor({
    sheetName: "Features",
    firstRowIsHeader: true,
    minRow: 1, maxRow: 15,
    cols: createColDescriptor({flagName: 'A', value: 'B?',}),
    ignoreRowWhen: (rowType) => !rowType.flagName
  }),
  formattings: createDescriptor({
    sheetName: "Features",
    firstRowIsHeader: true,
    minRow: 16, maxRow: 21,
    cols: createColDescriptor({formatName: 'A', value: 'B?',}),
    ignoreRowWhen: (rowType) => !rowType.formatName
  }),
  recordingCrawlerConfiguration: createDescriptor({
    sheetName: "Features",
    firstRowIsHeader: true,
    minRow: 22, maxRow: 30,
    cols: createColDescriptor({name: 'A', value: 'B?',}),
    ignoreRowWhen: (rowType) => !rowType.name
  }),
  scaleRating: createDescriptor({
    sheetName: "Features",
    firstRowIsHeader: true,
    minRow: 1, maxRow: 15,
    cols: createColDescriptor({name: 'E', value: 'F',}),
    ignoreRowWhen: (rowType) => !rowType.name || rowType.name.toLowerCase().includes("configuration")
  }),
  scaleRatingLabels: createDescriptor({
    sheetName: "Features",
    firstRowIsHeader: true,
    minRow: 17,
    cols: createColDescriptor({label: 'E',}),
    ignoreRowWhen: (rowType) => !rowType.label
  }),
  bingoRating: createDescriptor({
    sheetName: "Features",
    firstRowIsHeader: true,
    minRow: 1, maxRow: 2,
    cols: createColDescriptor({name: 'H', value: 'I',}),
    ignoreRowWhen: (rowType) => !rowType.name
  }),
  bingoRatingChoices: createDescriptor({
    sheetName: "Features",
    firstRowIsHeader: true,
    minRow: 17,
    cols: createColDescriptor({id: 'H', label: 'I',}),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  speakers: createDescriptor({
    sheetName: "Speakers",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({
      label: 'A',
      id: 'B',
      fullName: 'C',
      photoUrl: 'D?',
      companyName: 'E?',
      bio: 'F?',
      website: 'G?',
      xwitter: 'H?',
      linkedin: 'I?',
      mastodon: 'J?',
      instagram: 'K?',
      youtube: 'L?',
      twitch: 'M?',
      github: 'N?',
      facebook: 'O?',
      flickr: 'P?',
    }),
    ignoreRowWhen: (rowType) => !rowType.id || !rowType.label,
  }),
  scheduleRoomsSetup: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({id: 'A', title: 'B',}),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  scheduleFormatsSetup: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({
      id: 'D', title: 'E',
      duration: { col: 'F', parser: DURATION_IN_MINUTES_PARSER },
      themeColor: { col: 'G', parser: HEX_COLOR_PARSER },
    }),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  scheduleTracksSetup: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({id: 'J', title: 'K', themeColor: { col: 'L', parser: HEX_COLOR_PARSER } }),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  scheduleSupportedTrackLanguages: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({id: 'O', label: 'P', themeColor: { col: 'Q', parser: HEX_COLOR_PARSER } }),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  schedule: createDescriptor({
    sheetName: "Schedule",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({
      id: 'A',
      roomId: 'B',
      type: { col: 'C', parser: z.union([z.literal('Talk'), z.literal('Break')]) },
      formatId: 'D',
      start: 'E',
      title: 'G',
      trackId: 'H?',
      langId: 'I?',
      commaSeparatedSpeakerFullNames: 'J?',
      summary: 'K?',
      commaSeparatedTags: 'L?',
      overflow: { col: 'M', parser: z.union([z.literal('NO'), z.literal('YES')]) }
    }),
    ignoreRowWhen: (rowType) => !rowType.id,
  }),
  sponsorCategories: createDescriptor({
    sheetName: "Sponsors",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({name: 'A', color: 'B', fontColor: 'D'}),
    ignoreRowWhen: (rowType) => !rowType.name
  }),
  sponsors: createDescriptor({
    sheetName: "Sponsors",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({categoryId: 'G', companyName: 'H', logoUrl: 'I?', websiteUrl: 'J?'}),
    ignoreRowWhen: (rowType) => !rowType.categoryId,
  }),
} satisfies GSheetDescriptors;


function transformRows<PARSER extends ZodType>(context: string, parser: PARSER, init = {} as Partial<z.infer<PARSER>>) {
  return <T>(
    rows: T[],
    resultBuilder: (buildingResult: Partial<z.infer<PARSER>>, row: T) => void
  ): z.infer<PARSER> => {
    const result = rows.reduce((buildingResult, row) => {
      resultBuilder(buildingResult, row);
      return buildingResult;
    }, init);

    const parsingResult = parser.safeParse(result);
    if(parsingResult.success) {
      return parsingResult.data;
    } else {
      const errorMessage = `Error while building gsheet content for context=${context}:\n${JSON.stringify(parsingResult.error)}`
      logger.error(errorMessage)
      throw new Error(errorMessage);
    }
  }
}

export async function crawlGsheet(eventId: string, gsheetId: string): Promise<FullEvent> {
  const gsheetReader = new GSheetReader(GSHEETS_EVENT_DESCRIPTORS);

  const gsheetContent = await gsheetReader.readAll(gsheetId);

  const mainDescription = transformRows('mainDescription', z.object({
    title: z.string(), headingTitle: z.string(), description: z.string().optional(),
    timezone: z.string(), keywords: z.array(z.string()), peopleDescription: z.string().optional(),
    backgroundUrl: z.string(), logoUrl: z.string(), ticketingUrl: z.string(),
  }))(gsheetContent.mainDescription, (mainDescription, row) => {
    match(row)
      .with({ name: P.string.regex(/^title/gi) }, ({ value }) => mainDescription.title = value)
      .with({ name: P.string.regex(/^heading\s+title/gi) }, ({ value }) => mainDescription.headingTitle = value)
      .with({ name: P.string.regex(/^description/gi) }, ({ value }) => mainDescription.description = value)
      .with({ name: P.string.regex(/^timezone/gi) }, ({ value }) => mainDescription.timezone = value)
      .with({ name: P.string.regex(/keywords/gi) }, ({ value }) => mainDescription.keywords = parseCommaSeparatedValues(value))
      .with({ name: P.string.regex(/^people\s+description/gi) }, ({ value }) => mainDescription.peopleDescription = value)
      .with({ name: P.string.regex(/^background\s+url/gi) }, ({ value }) => mainDescription.backgroundUrl = value)
      .with({ name: P.string.regex(/^logo\s+url/gi) }, ({ value }) => mainDescription.logoUrl = value)
      .with({ name: P.string.regex(/^ticketing\s+url/gi) }, ({ value }) => mainDescription.ticketingUrl = value)
      .run();
  });

  const eventLocation = transformRows('eventLocation', z.object({
    address: z.string(), city: z.string(), country: z.string(),
    latitude: z.number(), longitude: z.number(),
  }))(gsheetContent.eventLocation, (eventLocation, row) => {
    match(row)
      .with({ name: P.string.regex(/^address/gi) }, ({ value }) => eventLocation.address = value)
      .with({ name: P.string.regex(/^city/gi) }, ({ value }) => eventLocation.city = value)
      .with({ name: P.string.regex(/^country/gi) }, ({ value }) => eventLocation.country = value)
      .with({ name: P.string.regex(/^latitude/gi) }, ({ value }) => eventLocation.latitude = Number(value))
      .with({ name: P.string.regex(/^longitude/gi) }, ({ value }) => eventLocation.longitude = Number(value))
      .run();
  });

  const theming = transformRows('theming', z.object({
    primaryHex: HEX_COLOR_PARSER, primaryContrastHex: HEX_COLOR_PARSER,
    secondaryHex: HEX_COLOR_PARSER, secondaryContrastHex: HEX_COLOR_PARSER,
    tertiaryHex: HEX_COLOR_PARSER, tertiaryContrastHex: HEX_COLOR_PARSER,
  }))(gsheetContent.theming, (theming, row) => {
    match(row)
      .with({ colorName: P.string.regex(/^primary\s+contrast/gi) }, ({ color }) => theming.primaryContrastHex = color as HexColor)
      .with({ colorName: P.string.regex(/^primary/gi) }, ({ color }) => theming.primaryHex = color as HexColor)
      .with({ colorName: P.string.regex(/^secondary\s+contrast/gi) }, ({ color }) => theming.secondaryContrastHex = color as HexColor)
      .with({ colorName: P.string.regex(/^secondary/gi) }, ({ color }) => theming.secondaryHex = color as HexColor)
      .with({ colorName: P.string.regex(/^tertiary\s+contrast/gi) }, ({ color }) => theming.tertiaryContrastHex = color as HexColor)
      .with({ colorName: P.string.regex(/^tertiary/gi) }, ({ color }) => theming.tertiaryHex = color as HexColor)
      .run();
  });

  const socialMedias = transformRows('socialMedias', z.array(z.object({
    type: SOCIAL_MEDIA_TYPE, href: z.string()
  })), [])(gsheetContent.socialMedia, (socialMedia, row) => {
    match(row)
      .with({ socialMediaName: P.string.regex(/website/gi), href: P.nonNullable }, ({ href }) =>  socialMedia.push({ type: 'website' as const, href }))
      .with({ socialMediaName: P.string.regex(/twitter/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'twitter' as const, href }))
      .with({ socialMediaName: P.string.regex(/youtube/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'youtube' as const, href }))
      .with({ socialMediaName: P.string.regex(/linkedin/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'linkedin' as const, href }))
      .with({ socialMediaName: P.string.regex(/flickr/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'flickr' as const, href }))
      .with({ socialMediaName: P.string.regex(/mastodon/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'mastodon' as const, href }))
      .with({ socialMediaName: P.string.regex(/instagram/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'instagram' as const, href }))
      .with({ socialMediaName: P.string.regex(/facebook/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'facebook' as const, href }))
      .with({ socialMediaName: P.string.regex(/github/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'github' as const, href }))
      .with({ socialMediaName: P.string.regex(/bluesky/gi), href: P.nonNullable }, ({ href }) => socialMedia.push({ type: 'bluesky' as const, href }))
      .otherwise(() => { /* no-op */ });
  });

  const featureFlags = transformRows('featureFlags', z.object({
    favoritesEnabled: z.boolean().default(true),
    roomsDisplayed: z.boolean().default(false),
    showInfosTab: z.boolean().default(true),
    showRoomCapacityIndicator: z.boolean().default(false),
    hideLanguages: z.array(z.string()).default([]),
    feedbacksEnabled: z.boolean().default(false),
    hideSchedule: z.boolean().default(true),
    remindMeOnceVideosAreAvailableEnabled: z.boolean().default(false),
  }))(gsheetContent.features, (featureFlags, row) => {
    match(row)
      .with({ flagName: P.string.regex(/favorites/gi) }, ({ value }) =>  featureFlags.favoritesEnabled = parseEnabledBoolean(value))
      .with({ flagName: P.string.regex(/rooms\s+displayed/gi) }, ({ value }) => featureFlags.roomsDisplayed = parseEnabledBoolean(value))
      .with({ flagName: P.string.regex(/show\s+infos\s+tab/gi) }, ({ value }) => featureFlags.showInfosTab = parseEnabledBoolean(value))
      .with({ flagName: P.string.regex(/show\s+live.*capacity.*indicator/gi) }, ({ value }) => featureFlags.showRoomCapacityIndicator = parseEnabledBoolean(value))
      .with({ flagName: P.string.regex(/hide\s+language/gi) }, ({ value }) => featureFlags.hideLanguages = parseCommaSeparatedValues(value))
      .with({ flagName: P.string.regex(/feedbacks/gi) }, ({ value }) => featureFlags.feedbacksEnabled = parseEnabledBoolean(value))
      .with({ flagName: P.string.regex(/hide\s+schedule/gi) }, ({ value }) => featureFlags.hideSchedule = parseEnabledBoolean(value))
      .run();
  });

  const formattings = transformRows('formattings', z.object({
    talkFormatTitle: z.union([z.literal('with-duration'), z.literal('without-duration')]).default('with-duration'),
    parseMarkdownOn: z.array(z.union([z.literal('talk-summary'), z.literal('speaker-bio')])).default(['talk-summary', 'speaker-bio']),
  }))(gsheetContent.formattings, (formattings, row) => {
    match(row)
      .with({ formatName: P.string.regex(/talk\s+title\s+format/gi) }, ({ value }) =>  formattings.talkFormatTitle = parseUnionLiteralValueWithDefault(value, ['with-duration', 'without-duration'] as const, 'without-duration'))
      .with({ formatName: P.string.regex(/parse\s+markdown/gi) }, ({ value }) => formattings.parseMarkdownOn = parseCommaSeparatedValues(value).map(str => str as 'talk-summary'|'speaker-bio'))
      .run();
  });

  const recordingConfig = transformRows('recordingCrawlerConfiguration', z.object({
    platform: z.literal('youtube').optional(),
    youtubeHandle: z.string().optional(),
    recordedFormatIds: z.array(z.string()).optional(),
    notRecordedFormatIds: z.array(z.string()).optional(),
    recordedRoomIds: z.array(z.string()).optional(),
    notRecordedRoomIds: z.array(z.string()).optional(),
    ignoreVideosPublishedAfter: ISO_LOCAL_DATE_PARSER.optional(),
    excludeTitleWordsFromMatching: z.array(z.string()).optional(),
  }))(gsheetContent.recordingCrawlerConfiguration, (config, row) => {
    match(row)
      .with({ name: P.string.regex(/platform/gi) }, ({ value }) =>  config.platform = parseUnionLiteralValue(value, ['youtube'] as const))
      .with({ name: P.string.regex(/youtube\s+handle/gi) }, ({ value }) => config.youtubeHandle = value)
      .with({ name: P.string.regex(/ignore\s+videos\s+published\s+after/gi) }, ({ value }) => config.ignoreVideosPublishedAfter = value as ISOLocalDate)
      .with({ name: P.string.regex(/not\s+recorded\s+format\s+ids/gi) }, ({ value }) => config.notRecordedFormatIds = parseCommaSeparatedValues(value))
      .with({ name: P.string.regex(/recorded\s+format\s+ids/gi) }, ({ value }) => config.recordedFormatIds = parseCommaSeparatedValues(value))
      .with({ name: P.string.regex(/not\s+recorded\s+room\s+ids/gi) }, ({ value }) => config.notRecordedRoomIds = parseCommaSeparatedValues(value))
      .with({ name: P.string.regex(/recorded\s+room\s+ids/gi) }, ({ value }) => config.recordedRoomIds = parseCommaSeparatedValues(value))
      .with({ name: P.string.regex(/words\s+excluded/gi) }, ({ value }) => config.excludeTitleWordsFromMatching = parseCommaSeparatedValues(value))
      .run();
  });

  const scaleRatingsConfig = transformRows('scaleRating', z.object({
    enabled: z.boolean(),
    icon: z.union([z.literal('star'), z.literal('thumbs-up')]),
    minimumNumberOfRatingsToBeConsidered: z.number(),
    minimumAverageScoreToBeConsidered: z.number(),
    numberOfDailyTopTalksConsidered: z.number(),
  }))(gsheetContent.scaleRating, (config, row) => {
    match(row)
      .with({ name: P.string.regex(/scale\s+rating/gi) }, ({ value }) =>  config.enabled = parseEnabledBoolean(value))
      .with({ name: P.string.regex(/icon/gi) }, ({ value }) => config.icon = parseUnionLiteralValueWithDefault(value, ['star', 'thumbs-up'] as const, 'star'))
      .with({ name: P.string.regex(/minimum\s+ratings\s+to\s+be\s+considered/gi) }, ({ value }) => config.minimumNumberOfRatingsToBeConsidered = Number(value))
      .with({ name: P.string.regex(/minimum\s+average\s+score/gi) }, ({ value }) => config.minimumAverageScoreToBeConsidered = Number(value))
      .with({ name: P.string.regex(/number\s+of\s+daily\s+top\s+talks/gi) }, ({ value }) => config.numberOfDailyTopTalksConsidered = Number(value))
      .run();
  });

  const scaleRatingLabels = z.array(z.string()).min(3).max(7).parse(gsheetContent.scaleRatingLabels.map(row => row.label));

  const bingoRatingsConfig = transformRows('bingoRating', z.object({
    enabled: z.boolean(),
  }))(gsheetContent.bingoRating, (config, row) => {
    match(row)
      .with({ name: P.string.regex(/bingo\s+rating/gi) }, ({ value }) =>  config.enabled = parseEnabledBoolean(value))
      .run();
  });

  const schedule = await gsheetReader.read(gsheetId, 'schedule');
  type ScheduleBaseEntry = {
    id: string,
    roomId: string,
    formatId: string,
    start: string,
    title: string,
  }
  type ScheduleTalk = { type: 'Talk' } & ScheduleBaseEntry & {
    trackId: string,
    langId: string,
    speakerFullNames: string[],
    summary: string,
    tags: string[],
    overflow: boolean,
  };
  type ScheduleBreak = { type: 'Break' } & ScheduleBaseEntry;

  const speakersByLabel = gsheetContent.speakers.reduce((speakersByLabel, rawSpeaker) => {
    speakersByLabel[rawSpeaker.label] = {
      id: rawSpeaker.id,
      fullName: rawSpeaker.fullName,
      photoUrl: rawSpeaker.photoUrl,
      companyName: rawSpeaker.companyName,
      bio: rawSpeaker.bio,
      social: ([] as SocialLink[])
        .concat(rawSpeaker.website ? [{ type: 'website' as const, url: rawSpeaker.website }]:[])
        .concat(rawSpeaker.xwitter ? [{ type: 'twitter' as const, url: rawSpeaker.xwitter }]:[])
        .concat(rawSpeaker.linkedin ? [{ type: 'linkedin' as const, url: rawSpeaker.linkedin }]:[])
        .concat(rawSpeaker.mastodon ? [{ type: 'mastodon' as const, url: rawSpeaker.mastodon }]:[])
        .concat(rawSpeaker.instagram ? [{ type: 'instagram' as const, url: rawSpeaker.instagram }]:[])
        .concat(rawSpeaker.youtube ? [{ type: 'youtube' as const, url: rawSpeaker.youtube }]:[])
        .concat(rawSpeaker.twitch ? [{ type: 'twitch' as const, url: rawSpeaker.twitch }]:[])
        .concat(rawSpeaker.github ? [{ type: 'github' as const, url: rawSpeaker.github }]:[])
        .concat(rawSpeaker.facebook ? [{ type: 'facebook' as const, url: rawSpeaker.facebook }]:[])
        .concat(rawSpeaker.flickr ? [{ type: 'flickr' as const, url: rawSpeaker.flickr }]:[])
    }
    return speakersByLabel;
  }, {} as Record<string, Speaker>);


        const talkStart = toTimezoneOffsettedDateTime(`${talkEntry.start}:00`, mainDescription.timezone);
        const talkEnd = addDuration(talkStart, mainDescription.timezone, format.duration);
        const expectedTimeslotId: TalkTimeSlotId = `${talkStart}--${talkEnd}`
        const maybeTimeslot: TalksTimeSlot|undefined = talksTimeSlotsFrom(dailySchedule.timeSlots).find(ts => ts.id === expectedTimeslotId)

        const talksTimeslot = match(maybeTimeslot)
          .with(P.nullish, () => {
            const talksTimeslot: TalksTimeSlot = {id: expectedTimeslotId, type: 'talks', talks: [], start: talkStart, end: talkEnd };
            dailySchedule.timeSlots.push(talksTimeslot);
            return talksTimeslot;
          })
          .otherwise(timeslot => timeslot);

        const talk: Talk = {
          id: talkEntry.id,
          room, format, track,
          title: talkEntry.title,
          speakers: talkSpeakers,
          language: language.id,
          isOverflow: parseYesNoBoolean(talkEntry.overflow),
        }
        talksTimeslot.talks.push(talk);

        const detailedTalk: DetailedTalk = {
          ...talk,
          start: talkStart,
          end: talkEnd,
          summary: talkEntry.summary || '',
          description: talkEntry.summary || '',
          tags: parseCommaSeparatedValues(talkEntry.commaSeparatedTags),
          assets: [],
        }
        detailedTalks.push(detailedTalk);
      })
      .with({ type: 'Break' }, breakEntry => {
        const breakStart = toTimezoneOffsettedDateTime(`${breakEntry.start}:00`, mainDescription.timezone);
        const breakEnd = addDuration(breakStart, mainDescription.timezone, format.duration);
        const expectedTimeslotId: BreakTimeSlotId = `${breakStart}--${breakEnd}--${breakEntry.roomId}`
        const maybeTimeslot = breakTimeSlotsFrom(dailySchedule.timeSlots).find(ts => ts.id === expectedTimeslotId)

        return match(maybeTimeslot)
          .with(P.nullish, () => {
            const breakTimeslot: BreakTimeSlot = {
              id: expectedTimeslotId, type: 'break', start: breakStart, end: breakEnd,
              break: {
                icon: 'cafe',
                title: breakEntry.title,
                room,
              }
            };
            dailySchedule.timeSlots.push(breakTimeslot);
            return breakTimeslot;

          })
          .otherwise(timeslot => timeslot);
      })
      .exhaustive()

    return { dailySchedules, detailedTalks };
  }, { dailySchedules: [] as DailySchedule[], detailedTalks: [] as DetailedTalk[] })

  fillBreakIcons(dailySchedules, mainDescription.timezone);

  const eventInfo: FullEvent['info'] = {
    id: eventId,
    title: mainDescription.title,
    description: mainDescription.description,
    days: gsheetContent.days,
    timezone: mainDescription.timezone,
    keywords: mainDescription.keywords,
    location: {
      country: eventLocation.country,
      city: eventLocation.city,
      address: eventLocation.address,
      coords: { latitude: eventLocation.latitude, longitude: eventLocation.longitude },
    },
    peopleDescription: mainDescription.peopleDescription,
    backgroundUrl: mainDescription.backgroundUrl,
    logoUrl: mainDescription.logoUrl,
    theming: {
      colors: theming,
      headingCustomStyles: null, // TODO
      headingSrcSet: null, // TODO
      customImportedFonts: null, // TODO
    } // TODO
  }

  const event: FullEvent = {
    id: eventId,
    info: eventInfo,
    daySchedules: dailySchedules,
    talks: detailedTalks,
    conferenceDescriptor: {
      ...eventInfo,
      headingTitle: mainDescription.headingTitle,
      headingSubTitle: "", // TODO
      headingBackground: "", // TODO
      features: {
        favoritesEnabled: featureFlags.favoritesEnabled,
        roomsDisplayed: featureFlags.roomsDisplayed,
        showInfosTab: featureFlags.showInfosTab,
        showRoomCapacityIndicator: featureFlags.showRoomCapacityIndicator,
        hideLanguages: featureFlags.hideLanguages,
        remindMeOnceVideosAreAvailableEnabled: false, // TODO
        // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
        ratings: {
          bingo: {
            enabled: bingoRatingsConfig.enabled,
            choices: gsheetContent.bingoRatingChoices,
          },
          scale: {
            enabled: scaleRatingsConfig.enabled,
            icon: scaleRatingsConfig.icon,
            // @ts-expect-error: string[] to string-tuple expected as zod can't seem to handle fixed-sized arrays as tuples
            labels: scaleRatingLabels,
          },
          "free-text": {
            enabled: false, // TODO
            maxLength: 42, // TODO
          },
          "custom-scale": {
            enabled: false, // TODO
            choices: [], // TODO
          }
        },
        topRatedTalks: {
          minimumNumberOfRatingsToBeConsidered: scaleRatingsConfig.minimumNumberOfRatingsToBeConsidered,
          minimumAverageScoreToBeConsidered: scaleRatingsConfig.minimumAverageScoreToBeConsidered,
          numberOfDailyTopTalksConsidered: scaleRatingsConfig.numberOfDailyTopTalksConsidered,
        },
        recording: match(recordingConfig)
          .with({ youtubeHandle: P.nonNullable, platform: P.nonNullable}, recordingConfig => recordingConfig)
          .otherwise(() => undefined),
      },
      talkFormats: gsheetContent.scheduleFormatsSetup,
      talkTracks: gsheetContent.scheduleTracksSetup,
      supportedTalkLanguages: gsheetContent.scheduleSupportedTrackLanguages,
      rooms: gsheetContent.scheduleRoomsSetup,
      infos: {
        floorPlans: gsheetContent.floorPlans,
        socialMedias,
        sponsors: undefined, // TODO
      },
      formattings,
    }
  }

  return event
}

function parseEnabledBoolean(value: string | undefined) {
  return (value || '').toLowerCase().includes('enabled');
}
function parseYesNoBoolean(value: string | undefined) {
  return (value || '').toLowerCase().includes('yes');
}

function parseCommaSeparatedValues(value: string | undefined) {
  return value?.split(/\s*,\s*/gi) || []
}

function parseUnionLiteralValue<const T extends readonly string[]>(
  value: string | undefined,
  allowedValues: T,
  applyToLowerCase = true,
): T[number] | undefined {
  const transformedValue = (applyToLowerCase && value) ? value.toLowerCase() : value;
  return allowedValues.includes(transformedValue as T[number]) ? transformedValue as T[number] : undefined;
}
function parseUnionLiteralValueWithDefault<const T extends readonly string[]>(
  value: string | undefined,
  allowedValues: T,
  defaultValue: T[number],
  applyToLowerCase = true,
): T[number] {
  return parseUnionLiteralValue(value, allowedValues, applyToLowerCase) || defaultValue;
}

function addDuration(datetime: ISODatetime, timezone: string, duration: ISODuration): ISODatetime {
  return Temporal.ZonedDateTime.from(`${datetime}[${timezone}]`)
    .add(Temporal.Duration.from(duration))
    .toString({ timeZoneName: 'never' }) as ISODatetime;
}
