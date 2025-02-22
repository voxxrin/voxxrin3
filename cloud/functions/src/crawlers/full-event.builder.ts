import {FullEvent} from "../models/Event";
import {
  Break,
  BreakTimeSlot, DailySchedule, DetailedTalk,
  Room, ScheduleTimeSlot,
  Speaker, Talk, TalkFormat,
  TalksTimeSlot, ThemedTalkFormat, ThemedTrack, TimeSlotBase,
  Track,
} from "../../../../shared/daily-schedule.firestore";
import {ISODatetime, Replace} from "../../../../shared/type-utils";
import {pick, sortBy} from "lodash";
import {LineupSpeaker} from "../../../../shared/event-lineup.firestore";
import {Temporal} from "@js-temporal/polyfill";
import {match, P} from "ts-pattern";
import {TALK_FORMAT_FALLBACK_COLORS, TALK_TRACK_FALLBACK_COLORS} from "./crawl";
import {ThemedLanguage} from "../../../../shared/conference-descriptor.firestore";

export type RawUnallocatedDetailedTalk = Replace<DetailedTalk, {
  speakers?: undefined,
  speakerIds: string[],

  format?: undefined,
  formatId: string,

  track?: undefined,
  trackId: string,

  room?: undefined,
  allocation?: undefined,
}>

export class FullEventBuilder {

  private readonly formatsById: Map<string, ThemedTalkFormat> = new Map();
  private readonly tracksById: Map<string, ThemedTrack> = new Map();
  private readonly languagesById: Map<string, ThemedLanguage> = new Map();
  private readonly roomsById: Map<string, Room> = new Map();
  private readonly speakersById: Map<string, LineupSpeaker> = new Map();
  private readonly detailedTalksById: Map<string, DetailedTalk> = new Map();
  private readonly talkTimeslots: TalksTimeSlot[] = [];
  private readonly breakTimeslots: BreakTimeSlot[] = [];

  private listableEventInfo: FullEvent['listableEventInfo']|undefined = undefined;
  private descriptor: FullEvent['conferenceDescriptor']|undefined = undefined;

  constructor(readonly eventId: string){}

  public addFormat(format: TalkFormat, opts: { ignoreDuplicates: boolean } = { ignoreDuplicates: false }): this {
    return this.addThemedFormat({
      id: format.id,
      title: format.title,
      duration: format.duration,
      themeColor: TALK_FORMAT_FALLBACK_COLORS[this.formatsById.size % TALK_FORMAT_FALLBACK_COLORS.length]
    }, opts)
  }
  public addThemedFormat(format: ThemedTalkFormat, { ignoreDuplicates }: { ignoreDuplicates: boolean } = { ignoreDuplicates: false }): this {
    if(this.formatsById.has(format.id)) {
      if(!ignoreDuplicates) {
        console.warn(`Trying to add duplicated format with id ${format.id} ! Skipped !`)
      }
    } else {
      this.formatsById.set(format.id, {
        id: format.id,
        title: format.title,
        duration: format.duration,
        themeColor: format.themeColor,
      });
    }

    return this;
  }

  public addTrack(track: Track, opts: { ignoreDuplicates: boolean } = { ignoreDuplicates: false }): this {
    return this.addThemedTrack({
      id: track.id,
      title: track.title,
      themeColor: TALK_TRACK_FALLBACK_COLORS[this.tracksById.size % TALK_TRACK_FALLBACK_COLORS.length]
    }, opts)
  }
  public addThemedTrack(track: ThemedTrack, { ignoreDuplicates }: { ignoreDuplicates: boolean } = { ignoreDuplicates: false }): this {
    if(this.tracksById.has(track.id)) {
      if(!ignoreDuplicates) {
        console.warn(`Trying to add duplicated track with id ${track.id} ! Skipped !`)
      }
    } else {
      this.tracksById.set(track.id, {
        id: track.id,
        title: track.title,
        themeColor: track.themeColor,
      });
    }

    return this;
  }

  public addThemedLanguage(lang: ThemedLanguage, { ignoreDuplicates }: { ignoreDuplicates: boolean } = { ignoreDuplicates: false }): this {
    if(this.languagesById.has(lang.id)) {
      if(!ignoreDuplicates) {
        console.warn(`Trying to add duplicated language with id ${lang.id} ! Skipped !`)
      }
    } else {
      this.languagesById.set(lang.id, {
        id: lang.id,
        label: lang.label,
        themeColor: lang.themeColor,
      });
    }

    return this;
  }

  public addSpeaker(speaker: Speaker): this {
    if(this.speakersById.has(speaker.id)) {
      // console.warn(`Trying to add duplicated speaker with id ${speaker.id} ! Skipped !`)
    } else {
      this.speakersById.set(speaker.id, {
        id: speaker.id,
        fullName: speaker.fullName,
        companyName: speaker.companyName,
        photoUrl: speaker.photoUrl,
        bio: speaker.bio,
        social: speaker.social,
        talks: [],
      });
    }

    return this;
  }

  public addTalk(detailedTalk: RawUnallocatedDetailedTalk): this {
    const format = this.formatsById.get(detailedTalk.formatId)
    if(!format) {
      throw new Error(`[talk ${detailedTalk.id}] No format found with id [${detailedTalk.formatId}] !`)
    }

    const track = this.tracksById.get(detailedTalk.trackId)
    if(!track) {
      throw new Error(`[talk ${detailedTalk.id}] No track found with id [${detailedTalk.trackId}] !`)
    }

    const lang = this.languagesById.get(detailedTalk.language);
    if(!lang) {
      throw new Error(`[talk ${detailedTalk.id}] No language found with id [${detailedTalk.language}] !`)
    }

    const speakers = detailedTalk.speakerIds.map(talkSpeakerId => {
      const speaker = this.speakersById.get(talkSpeakerId);
      if(!speaker) {
        throw new Error(`[talk ${detailedTalk.id}] No speaker found with id [${talkSpeakerId}] !`)
      }

      speaker.talks.push({
        id: detailedTalk.id,
        title: detailedTalk.title,
        format: {
          id: format.id,
          title: format.title,
          duration: format.duration,
          // themeColor will lazily be resolved from event descriptor at rendering time
        },
        track: {
          id: track.id,
          title: track.title,
          // themeColor will lazily be resolved from event descriptor at rendering time
        },
        tags: detailedTalk.tags,
        language: detailedTalk.language,
        otherSpeakers: detailedTalk.speakerIds.filter(speakerIdCandidate => speakerIdCandidate !== talkSpeakerId)
          .map(spId => {
            const otherSpeaker = this.speakersById.get(spId)!
            return {
              id: otherSpeaker.id,
              fullName: otherSpeaker.fullName,
              photoUrl: otherSpeaker.photoUrl,
              companyName: otherSpeaker.companyName,
              bio: otherSpeaker.bio,
              social: otherSpeaker.social,
            }
          }),
        allocation: null
      })
      return speaker;
    })

    this.detailedTalksById.set(detailedTalk.id, {
      id: detailedTalk.id,
      title: detailedTalk.title,
      description: detailedTalk.description,
      summary: detailedTalk.summary,
      tags: detailedTalk.tags,
      language: detailedTalk.language,
      isOverflow: detailedTalk.isOverflow,
      assets: detailedTalk.assets,
      speakers, format, track,
      room: null,
      allocation: null,
    });

    return this;
  }

  public addRoom(room: Room): this {
    if(this.roomsById.has(room.id)) {
      console.warn(`Trying to add duplicated room with id ${room.id} ! Skipped !`)
    } else {
      this.roomsById.set(room.id, {
        id: room.id,
        title: room.title,
      });
    }

    return this;
  }

  private _allocateTalk({talk, start, maybeRoomId}: {
    talk: DetailedTalk,
    start: ISODatetime,
    maybeRoomId: string|undefined
  }): this {
    const maybeRoom = maybeRoomId ? this.roomsById.get(maybeRoomId) || null : null;
    if(maybeRoomId && !maybeRoom) {
      throw new Error(`No room found matching roomId=${maybeRoomId} for talkId=${talk.id}`);
    }

    const timeslotBase = timeslotBaseOf(start, talk.format.duration)
    talk.allocation = {
      start: timeslotBase.start,
      end: timeslotBase.end,
    }
    talk.room = maybeRoom;

    const timeslot: TalksTimeSlot = match(this.talkTimeslots.find(timeslot => timeslot.start === timeslotBase.start && timeslot.end === timeslotBase.end))
      .with(P.nullish, () => {
        const timeslot: TalksTimeSlot = {
          id: timeslotBase.id,
          start: timeslotBase.start,
          end: timeslotBase.end,
          type: "talks",
          talks: [],
        }
        this.talkTimeslots.push(timeslot);
        return timeslot;
      })
      .otherwise(timeslot => timeslot);

    timeslot.talks.push({
      id: talk.id,
      title: talk.title,
      format: talk.format,
      track: talk.track,
      room: maybeRoom,
      speakers: talk.speakers,
      language: talk.language,
      isOverflow: talk.isOverflow,
    });

    talk.speakers.forEach(talkSpeaker => {
      const speaker = this.speakersById.get(talkSpeaker.id);
      if(!speaker) {
        throw new Error(`[talk ${talk.id}] Not able to find speaker [${talkSpeaker.id}] during talk allocation (start=${start})`)
      }
      speaker.talks.forEach(talk => {
        talk.allocation = {
          start: timeslotBase.start,
          end: timeslotBase.end,
          room: maybeRoom,
        }
      })
    });

    return this;
  }

  public allocateTalk({talkId, start, maybeRoomId}: {
    talkId: string,
    start: ISODatetime,
    maybeRoomId: string|undefined
  }): this {
    const talk = this.detailedTalksById.get(talkId)
    if(!talk) {
      throw new Error(`No talk found for talkId=${talkId}`)
    }

    return this._allocateTalk({
      talk, start, maybeRoomId
    })
  }

  public allocateOverflowForTalk({talkId, start, inRoomId}: {
    talkId: string,
    start: ISODatetime,
    inRoomId: string
  }) {
    const talk = this.detailedTalksById.get(talkId)
    if(!talk) {
      throw new Error(`No talk found for talkId=${talkId}`)
    }

    return this._allocateTalk({
      talk: {
        ...pick(talk, ['id', 'room', 'format', 'track', 'speakers', 'tags', 'summary', 'description', 'language', 'assets', 'allocation']),
        title: `[OVERFLOW] ${talk.title}`,
        isOverflow: true,
      },
      start,
      maybeRoomId: inRoomId,
    });
  }

  public addBreak({ start, duration, title, roomId, icon }: {
    start: ISODatetime,
    duration: Temporal.Duration,
    title: string,
    roomId: string,
    icon: Break['icon']
  }): this {
    const timeslotBase = timeslotBaseOf(start, duration);
    const room = this.roomsById.get(roomId)
    if(!room) {
      throw new Error(`No room found matching id [${roomId}] while allocating break starting at ${start}`)
    }

    const breakTimeslot: BreakTimeSlot = {
      id: timeslotBase.id,
      start: timeslotBase.start,
      end: timeslotBase.end,
      type: 'break',
      break: {
        title,
        icon,
        room,
      }
    }
    this.breakTimeslots.push(breakTimeslot)

    return this;
  }

  public usingInfosAndDescriptor(listableEventInfo: FullEvent['listableEventInfo'], descriptor: Omit<FullEvent['conferenceDescriptor'], "rooms"|"talkTracks"|"talkFormats"|"supportedTalkLanguages"|keyof FullEvent['listableEventInfo']>): this {
    this.listableEventInfo = listableEventInfo;
    this.descriptor = {
      ...pick(listableEventInfo, ['id', 'title', 'days', 'timezone', 'keywords', 'location', 'backgroundUrl', 'logoUrl', 'theming']),
      ...pick(descriptor, ['headingTitle', 'headingBackground', 'features', 'formattings']),
      rooms: [...this.roomsById.values()],
      talkTracks: [...this.tracksById.values()],
      talkFormats: [...this.formatsById.values()],
      supportedTalkLanguages: [...this.languagesById.values()],
    };
    return this;
  }

  public updateTalk(talkId: string, callback: (opts: {simpleTalk: Talk, detailedTalk: DetailedTalk}) => void) {
    const detailedTalk = this.detailedTalksById.get(talkId);
    if(!detailedTalk) {
      throw new Error(`No detailed talk found with talkId=${talkId}`)
    }

    const simpleTalk = this.talkTimeslots
      .flatMap(timeslot => timeslot.talks)
      .find(talk => talk.id === talkId);

    if(!simpleTalk) {
      throw new Error(`No simple talk found with talkId=${talkId}`)
    }

    callback({ simpleTalk, detailedTalk });
  }

  public createFullEvent(): FullEvent {
    if(!this.listableEventInfo) {
      throw new Error(`Missing FullEvent's infos (in createFullEvent()) for eventId=${this.eventId}`)
    }

    if(!this.descriptor) {
      throw new Error(`Missing FullEvent's descriptor (in createFullEvent()) for eventId=${this.eventId}`)
    }

    const daySchedules = this.listableEventInfo.days.map(day => {
      const talksTimeslots = this.talkTimeslots.filter(ts => ts.start.startsWith(day.localDate))
      const breaksTimeslots = this.breakTimeslots.filter(ts => ts.start.startsWith(day.localDate))

      const sortedTimeslots: ScheduleTimeSlot[] = sortBy(
        ([] as ScheduleTimeSlot[])
          .concat(talksTimeslots)
          .concat(breaksTimeslots)
        , timeslot => `${timeslot.type === 'break'?0:1}--${timeslot.start}`
      )

      const daySchedule: DailySchedule = {
        day: day.id,
        timeSlots: sortedTimeslots,
      }

      return daySchedule;
    })

    return {
      id: this.eventId,
      listableEventInfo: this.listableEventInfo,
      conferenceDescriptor: {
        ...pick(this.descriptor, [
          'id', 'title', 'days', 'timezone', 'keywords', 'location', 'backgroundUrl',
          'logoUrl', 'theming', 'headingTitle', 'headingBackground', 'talkFormats',
          'talkTracks', 'supportedTalkLanguages', 'rooms', 'formattings'
        ]),
        features: {
          ...this.descriptor.features,
          skipShowingSchedule: this.talkTimeslots.length === 0 || !!this.descriptor.features.skipShowingSchedule,
        }
      },
      talks: [...this.detailedTalksById.values()],
      lineupSpeakers: [...this.speakersById.values()],
      daySchedules
    }
  }
}

function timeslotBaseOf(start: ISODatetime, duration: Parameters<Temporal.Instant['add']>[0]) {
  const utcStart = Temporal.Instant.from(start).toString() as ISODatetime;
  const utcEnd = Temporal.Instant.from(start).add(duration).toString() as ISODatetime;
  const id: TimeSlotBase['id'] = `${utcStart}--${utcEnd}`

  const base: TimeSlotBase = { id, start: utcStart, end: utcEnd }
  return base;
}
