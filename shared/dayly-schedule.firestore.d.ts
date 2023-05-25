import type {ISODatetime} from "./type-utils";

export type Room = {id: string, title: string}

export type Break = {
    icon: 'ticket' | 'restaurant' | 'cafe' | 'beer' | 'film' | 'train';
    title: string;
    room: Room;
}

export type Track = {id: string, title: string}
export type TalkFormat = {
    duration: `PT${number}m`,
    id: string,
    title: string
}
export type Speaker = {
    photoUrl?: string|undefined|null,
    companyName?: string|undefined|null,
    fullName: string,
    id: string,
    bio?: string|undefined|null,
    social: Array<{type: "twitter"|"linkedin"|"mastodon", url: string}>
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

type TimeSlotBase<START extends ISODatetime = ISODatetime, END extends ISODatetime = ISODatetime> = {
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
