import { EventInfo } from "../../../../shared/models/event";
import { DayTalksStats } from "../../../../shared/models/feedbacks";
import { DaySchedule, Talk } from "../../../../shared/models/schedule";

export interface FullEvent {
    id: string,
    info: EventInfo,
    daySchedules: DaySchedule[],
    talkStats: DayTalksStats[],
    talks: Talk[]
}

