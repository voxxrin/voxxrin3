import { ListableEvent } from "../../../../shared/event-list.firestore";
import { DayTalksStats } from "../../../../shared/feedbacks.firestore";
import { DailySchedule, Talk } from "../../../../shared/dayly-schedule.firestore";

export interface FullEvent {
    id: string,
    info: ListableEvent,
    daySchedules: DailySchedule[],
    talkStats: DayTalksStats[],
    talks: Talk[]
}

