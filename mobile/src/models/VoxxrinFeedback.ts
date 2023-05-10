
// TODO: To complete
import {ScheduleTimeSlotId} from "@/models/VoxxrinSchedule";

export type VoxxrinTimeslotFeedback = {
    id: ScheduleTimeSlotId,
    start: string, // HH:mm
    end: string, // HH:mm
    full: string // HH:mm -> HH:mm
}
