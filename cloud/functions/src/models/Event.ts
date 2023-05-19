import { ListableEvent } from "../../../../shared/event-list.firestore";
import { DayTalksStats } from "../../../../shared/feedbacks.firestore";
import { DailySchedule, Talk } from "../../../../shared/dayly-schedule.firestore";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";

export interface FullEvent {
    id: string,
    conferenceDescriptor: ConferenceDescriptor,
    info: ListableEvent,
    daySchedules: DailySchedule[],
    talkStats: DayTalksStats[],
    talks: Talk[]
}

