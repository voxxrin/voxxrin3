import {ISODatetime, ISOLocalDate} from "./type-utils"

export interface ScheduleTimeSlot {
    id: string;
    start: ISODatetime;
    end: ISODatetime;
}

export interface RoomInfo {
    id: string,
    title: string
}

export interface BreakScheduleTimeSlot extends ScheduleTimeSlot {
    type: "break";
    break: {
        title: string,
        room: RoomInfo,
        icon: 'ticket' | 'restaurant' | 'cafe' | 'beer' | 'film' | 'train'
    };
}

export interface ScheduleSpeakerInfo {
    id: string, 
    fullName: string, 
    companyName: string, 
    photoUrl?:string
}

export interface ScheduleTalk {
    id: string;
    title: string;
    language: string;
    track: {id: string, title:string};
    format: {id: string, title:string, duration:string};
    room: RoomInfo;
    speakers: ScheduleSpeakerInfo[]    
}

export interface TalksScheduleTimeSlot extends ScheduleTimeSlot {
    type: "talks";
    talks: ScheduleTalk[];
}

export interface DaySchedule {
    day: string;
    timeSlots: (BreakScheduleTimeSlot | TalksScheduleTimeSlot)[];
}

export interface Talk {
    id: string;
    title: string;
    language: string;
    track: {id: string, title:string};
    format: {id: string, title:string, duration:string};
    room: RoomInfo;
    speakers: ScheduleSpeakerInfo[];
    summary: string;
    description: string;
}