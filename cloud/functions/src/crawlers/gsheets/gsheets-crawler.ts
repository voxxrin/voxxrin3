import {z, ZodObject} from "zod";
import {FullEvent} from "../../models/Event";
import {
  createColDescriptor, createDescriptor,
  GSheetDescriptors,
  GSheetReader
} from "./gsheet-reader";
import { match, P } from "ts-pattern";


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
    cols: createColDescriptor({socialMediaName: 'A', url: 'B?',}),
    ignoreRowWhen: (rowType) => !rowType.socialMediaName
  }),
  days: createDescriptor({
    sheetName: "Event description",
    firstRowIsHeader: true,
    minRow: 2, maxRow: 17,
    cols: createColDescriptor({id: 'E', localDate: {col: 'F', parser: z.string().regex(/\d{4}-\d{2}-\d{2}/)},}),
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
      fullName: 'A',
      photoUrl: 'B?',
      companyName: 'C?',
      bio: 'D?',
      website: 'E?',
      xwitter: 'F?',
      linkedin: 'G?',
      mastodon: 'H?',
      instagram: 'I?',
      youtube: 'J?',
      twitch: 'K?',
      github: 'L?',
      facebook: 'M?',
      flickr: 'N?',
    }),
    ignoreRowWhen: (rowType) => !rowType.fullName,
  }),
  scheduleRoomsSetup: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({id: 'A', label: 'B',}),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  scheduleFormatsSetup: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({id: 'D', label: 'E', durationInMinutes: 'F', themeColor: 'G'}),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  scheduleTracksSetup: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({id: 'J', label: 'K', themeColor: 'L'}),
    ignoreRowWhen: (rowType) => !rowType.id
  }),
  scheduleSupportedTrackLanguages: createDescriptor({
    sheetName: "Schedule setup",
    firstRowIsHeader: true,
    minRow: 2,
    cols: createColDescriptor({id: 'O', label: 'P', themeColor: 'Q'}),
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


function transformRows<PARSER extends ZodObject<any>>(parser: PARSER) {
  return <T>(
    rows: T[],
    resultBuilder: (buildingResult: Partial<z.infer<PARSER>>, row: T) => void
  ): z.infer<PARSER> => {
    const result = rows.reduce((buildingResult, row) => {
      resultBuilder(buildingResult, row);
      return buildingResult;
    }, {} as Partial<z.infer<PARSER>>);

    return parser.parse(result);
  }
}

export async function crawlGsheet(eventId: string, gsheetId: string): Promise<FullEvent> {
  const gsheetReader = new GSheetReader(GSHEETS_EVENT_DESCRIPTORS);

  const gsheetContent = await gsheetReader.readAll(gsheetId);

  const rawMainDescription = gsheetContent.mainDescription;

  const mainDescription = transformRows(z.object({
    title: z.string(), headingTitle: z.string(), description: z.string().optional(),
    timezone: z.string(), keywords: z.array(z.string()), peopleDescription: z.string().optional(),
    backgroundUrl: z.string(), logoUrl: z.string(), ticketingUrl: z.string(),
  }))(rawMainDescription, (mainDescription, row) => {
    match(row)
      .with({ name: P.string.regex(/^title/) }, ({ value }) => mainDescription.title = value)
      .with({ name: P.string.regex(/^heading\s+title/) }, ({ value }) => mainDescription.headingTitle = value)
      .with({ name: P.string.regex(/^description/) }, ({ value }) => mainDescription.description = value)
      .with({ name: P.string.regex(/^timezone/) }, ({ value }) => mainDescription.timezone = value)
      .with({ name: P.string.regex(/keywords/) }, ({ value }) => mainDescription.keywords = value?.split("\s*,\s*") || [])
      .with({ name: P.string.regex(/^people\s+description/) }, ({ value }) => mainDescription.peopleDescription = value)
      .with({ name: P.string.regex(/^background\s+url/) }, ({ value }) => mainDescription.backgroundUrl = value)
      .with({ name: P.string.regex(/^logo\s+url/) }, ({ value }) => mainDescription.logoUrl = value)
      .with({ name: P.string.regex(/^ticketing\s+url/) }, ({ value }) => mainDescription.ticketingUrl = value)
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

  const talksOrBreaks: Array<ScheduleBreak|ScheduleTalk> = schedule.map(row => {
    const {
      commaSeparatedSpeakerFullNames,
      commaSeparatedTags,
      trackId, langId, summary,
      ...rest
    } = row;

    return match(row)
      .with({ type: 'Talk' } , ({ type }) => {
        if(!trackId) { throw new Error(`Missing trackId for talk ${row.id} !`) }
        if(!langId) { throw new Error(`Missing langId for talk ${row.id} !`) }
        if(!summary) { throw new Error(`Missing summary for talk ${row.id} !`) }

        const scheduleTalk: ScheduleTalk = {
          ...rest, type, trackId, langId, summary,
          speakerFullNames: commaSeparatedSpeakerFullNames?.split(", ") || [],
          tags: commaSeparatedTags?.split(", ") || [],
          overflow: row.overflow === 'YES',
        };
        return scheduleTalk;
      })
      .with({ type: 'Break' }, ({ type }) => {
        const scheduleBreak: ScheduleBreak = { ...rest, type };
        return scheduleBreak;
      })
      .exhaustive();
  });

  talksOrBreaks.forEach(row => {
    match(row)
      .with({ type: 'Talk' }, (talk) => console.log(`This is a talk: ${JSON.stringify(talk)}`))
      .with({ type: 'Break' }, (breakEntry) => console.log(`This is a break: ${JSON.stringify(breakEntry)}`))
      .exhaustive();
  })

  const eventInfo: FullEvent['info'] = {
    id: eventId,
    title: mainDescription.title,
    description: mainDescription.description,
    days: [], // TODO
    timezone: mainDescription.timezone,
    keywords: mainDescription.keywords,
    location: { country: "", city: "" }, // TODO
    peopleDescription: mainDescription.peopleDescription,
    backgroundUrl: mainDescription.backgroundUrl,
    logoUrl: mainDescription.logoUrl,
    theming: {
      colors: { // TODO
        primaryHex: "#", // TODO
        primaryContrastHex: "#", // TODO
        secondaryHex: "#", // TODO
        secondaryContrastHex: "#", // TODO
        tertiaryHex: "#", // TODO
        tertiaryContrastHex: "#", // TODO
      },
      headingCustomStyles: null, // TODO
      headingSrcSet: null, // TODO
      customImportedFonts: null, // TODO
    } // TODO
  }

  const event: FullEvent = {
    id: eventId,
    info: eventInfo,
    daySchedules: [], // TODO
    talks: [], // TODO
    // descriptor.talks.map(detailedTalk => ({
    //   start: detailedTalk.start,
    //   end: detailedTalk.end,
    //   summary: detailedTalk.summary,
    //   description: detailedTalk.summary,
    //   tags: detailedTalk.tags,
    //   assets: detailedTalk.assets,
    //   speakers: detailedTalk.speakers,
    //   id: detailedTalk.id,
    //   title: detailedTalk.title,
    //   isOverflow: detailedTalk.isOverflow,
    //
    //   format: descriptor.talkFormats[0], // TODO
    //   language: descriptor.supportedTalkLanguages[0].id, // TODO
    //   track: descriptor.talkTracks[0], // TODO
    //   room: descriptor.rooms[0], // TODO
    // })),
    conferenceDescriptor: {
      ...eventInfo,
      headingTitle: mainDescription.headingTitle,
      headingSubTitle: "", // TODO
      headingBackground: "", // TODO
      features: {
        roomsDisplayed: false, // TODO
        favoritesEnabled: true, // TODO
        remindMeOnceVideosAreAvailableEnabled: false, // TODO
        showInfosTab: true, // TODO
        // for multi-lang conferences, where we want to hide "default" (implicit) conference lang (ex: in devoxxfr, we'd hide FR)
        hideLanguages: [], // TODO
        showRoomCapacityIndicator: false, // TODO
        ratings: {
          bingo: {
            enabled: false, // TODO
            choices: [], // TODO
          },
          scale: {
            enabled: false, // TODO
            icon: "star", // TODO
            labels: ['a', 'b', 'c'], // TODO
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
        topRatedTalks: { // TODO
          minimumNumberOfRatingsToBeConsidered: 100, // TODO
          minimumAverageScoreToBeConsidered: undefined, // TODO
          numberOfDailyTopTalksConsidered: 42, // TODO
        },
        recording: undefined, // TODO

      }, // TODO
      talkFormats: [], // TODO
      talkTracks: [], // TODO
      supportedTalkLanguages: [], // TODO
      rooms: [], // TODO
      infos: { // TODO
        floorPlans: undefined, // TODO,
        socialMedias: undefined, // TODO
        sponsors: undefined, // TODO
      },
      formattings: { talkFormatTitle: 'with-duration', parseMarkdownOn: [ 'talk-summary', 'speaker-bio' ] }, // TODO
    }
  }

  return event
}
