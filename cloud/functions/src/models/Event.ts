import { DayTalksStats } from "../../../../shared/models/feedbacks";
import { DaySchedule } from "../../../../shared/models/schedule";

export interface Event {
    id: string,
    daySchedules: DaySchedule[],
    talkStats: DayTalksStats[]
}

