import { ListableEvent } from "../../../../shared/event-list.firestore";
import {DailySchedule, DetailedTalk, Talk} from "../../../../shared/daily-schedule.firestore";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";

export interface FullEvent {
    id: string,
    conferenceDescriptor: Omit<ConferenceDescriptor, "eventFamily"|"eventName">,
    info: Omit<ListableEvent, "eventFamily"|"eventName">,
    daySchedules: DailySchedule[],
    talks: DetailedTalk[],
}

