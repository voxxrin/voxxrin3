import { ListableEvent } from "../../../../shared/event-list.firestore";
import {BreakTimeSlot, DailySchedule, DetailedTalk, Talk} from "../../../../shared/daily-schedule.firestore";
import {ConferenceDescriptor} from "../../../../shared/conference-descriptor.firestore";
import {Replace} from "../../../../shared/type-utils";

export type BreakTimeslotWithPotentiallyUnknownIcon = Replace<BreakTimeSlot, {
  break: Replace<BreakTimeSlot['break'], {
    icon: BreakTimeSlot['break']['icon'] | 'unknown'
  }>
}>

export interface FullEvent {
    id: string,
    conferenceDescriptor: Omit<ConferenceDescriptor, "eventFamily"|"eventName"|"websiteUrl"|"visibility"|"spaceToken">,
    info: Omit<ListableEvent, "eventFamily"|"eventName"|"websiteUrl"|"visibility"|"spaceToken">,
    daySchedules: DailySchedule[],
    talks: DetailedTalk[],
}

