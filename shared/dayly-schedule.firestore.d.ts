import type {ISODatetime} from "./type-utils";
import {HexColor} from "./type-utils";

export type Room = {id: string, title: string}

export type Break = {
    icon: 'ticket' | 'restaurant' | 'cafe' | 'beer' | 'film' | 'train';
    title: string;
    room: Room;
}

export type Track = {id: string, title: string}
export type ThemedTrack = Track & { themeColor: HexColor };
export type TalkFormat = {
    duration: `PT${number}m`,
    id: string,
    title: string
}
export type ThemedTalkFormat = TalkFormat & { themeColor: HexColor }
export type Speaker = {
    photoUrl?: string|null,
    companyName?: string|null,
    fullName: string,
    id: string,
    bio?: string|null,
    social: Array<{type: "twitter"|"linkedin"|"mastodon"|"instagram"|"youtube"|"twitch", url: string}>
}
export type Talk = {
    speakers: Speaker[],
    format: TalkFormat,
    language: string,
    id: string,
    title: string,
    track: Track,
    room: Room
}
export type DetailedTalk = Talk & {
    start: ISODatetime,
    end: ISODatetime,
    summary: string,
    description: string
}

export type TimeSlotBase<START extends ISODatetime = ISODatetime, END extends ISODatetime = ISODatetime> = {
    start: START,
    end: END,
    id: `${START}--${END}`,
}

export type BreakTimeSlot = TimeSlotBase & { type: 'break', break: Break }
export type TalksTimeSlot = TimeSlotBase & { type: 'talks', talks: Talk[] }

export type ScheduleTimeSlot = BreakTimeSlot | TalksTimeSlot


export type DailySchedule = {
    day: string;
    timeSlots: ScheduleTimeSlot[];
}
