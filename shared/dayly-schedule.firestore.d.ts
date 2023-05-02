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
    photoUrl: string,
    companyName: string,
    fullName: string,
    id: string
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

export type ScheduleTimeSlot<START extends ISODatetime = ISODatetime, END extends ISODatetime = ISODatetime> = {
    start: START,
    end: END,
    id: `${START}--${END}`,
} & ( {type: 'break', break: Break} | {type: 'talks', talks: Talk[]} )

export type DailySchedule = {
    day: string;
    timeSlots: ScheduleTimeSlot[];
}
