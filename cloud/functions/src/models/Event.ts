import { DayTalksStats } from "../../../../shared/models/feedbacks";
import { DaySchedule, Talk } from "../../../../shared/models/schedule";

export interface FullEvent {
    id: string,
    daySchedules: DaySchedule[],
    talkStats: DayTalksStats[],
    talks: Talk[]
}

