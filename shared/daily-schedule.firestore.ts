import type {ISODatetime, ISODuration} from "./type-utils";
import {HexColor, SocialMediaType} from "./type-utils";

export type Room = {id: string, title: string}

export type Break = {
    icon: 'ticket' | 'restaurant' | 'cafe' | 'beer' | 'movie' | 'wallet';
    title: string;
    room: Room;
}

export type Track = {id: string, title: string}
export type ThemedTrack = Track & { themeColor: HexColor };
export type TalkFormat = {
    duration: ISODuration,
    id: string,
    title: string
}
export type ThemedTalkFormat = TalkFormat & { themeColor: HexColor }
export type SocialLink = {type: SocialMediaType, url: string}
export type Speaker = {
    photoUrl?: string|null,
    companyName?: string|null,
    fullName: string,
    id: string,
    bio?: string|null,
    social: SocialLink[]
}
export type Talk = {
    speakers: Speaker[],
    format: TalkFormat,
    language: string,
    id: string,
    title: string,
    track: Track,
    room: Room|null,
    isOverflow: boolean
}
export type DetailedTalk = Talk & {
    summary: string,
    description: string,
    tags: string[],
    assets: TalkAsset[],
    allocation: {
      start: ISODatetime,
      end: ISODatetime,
    }|null
}

export type TalkAsset = {
  createdOn: ISODatetime,
  assetUrl: string
} & (
  { type: "recording", platform: RecordingPlatform }
  | { type: "slides" }
  | { type: "git-repository", platform: "github"|"gitlab"|"unknown" }
  | { type: "misc" }
)

export type TalkAssetType = TalkAsset['type'];
export type RecordingPlatform = "youtube"|"unknown"/* |"twitch"|"dailymotion"... */;

export type TimeSlotBase<START extends ISODatetime = ISODatetime, END extends ISODatetime = ISODatetime> = {
    start: START,
    end: END,
}

export type BreakTimeSlotId<START extends ISODatetime = ISODatetime, END extends ISODatetime = ISODatetime, ROOM_ID extends string = string> = `${START}--${END}--${ROOM_ID}`
export type BreakTimeSlot<
  START extends ISODatetime = ISODatetime,
  END extends ISODatetime = ISODatetime,
  ROOM_ID extends string = string,
> = TimeSlotBase<START, END> & { id: BreakTimeSlotId<START, END, ROOM_ID>, type: 'break', break: Break }
export type TalkTimeSlotId<START extends ISODatetime = ISODatetime, END extends ISODatetime = ISODatetime> = `${START}--${END}`
export type TalksTimeSlot<
  START extends ISODatetime = ISODatetime,
  END extends ISODatetime = ISODatetime,
> = TimeSlotBase<START, END> & { id: TalkTimeSlotId<START, END>, type: 'talks', talks: Talk[] }

export type ScheduleTimeSlot = BreakTimeSlot | TalksTimeSlot


export type DailySchedule = {
    day: string;
    timeSlots: ScheduleTimeSlot[];
}

export function breakTimeSlotsFrom(timeslots: ScheduleTimeSlot[]) {
    return timeslots.filter(timeslot => timeslot.type === 'break') as BreakTimeSlot[];
}
export function talksTimeSlotsFrom(timeslots: ScheduleTimeSlot[]) {
    return timeslots.filter(timeslot => timeslot.type === 'talks') as TalksTimeSlot[];
}
