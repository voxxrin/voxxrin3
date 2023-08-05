import { ListableEvent } from "../../../../shared/event-list.firestore";
import {DailySchedule, DetailedTalk, Talk} from "../../../../shared/daily-schedule.firestore";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";

export interface FullEvent {
    id: string,
    conferenceDescriptor: ConferenceDescriptor,
    info: ListableEvent,
    daySchedules: DailySchedule[],
    talks: DetailedTalk[]
}

