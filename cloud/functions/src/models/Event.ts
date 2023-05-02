import { DayTalksStats } from "../../../../shared/models/feedbacks";
import { DaySchedule, Talk } from "../../../../shared/models/schedule";

export interface Event {
    id: string,
    daySchedules: DaySchedule[],
    talkStats: DayTalksStats[],
    talks: Talk[]
}

