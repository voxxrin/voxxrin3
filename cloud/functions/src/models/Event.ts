import {ListableEvent} from "@shared/event-list.firestore";
import {BreakTimeSlot, DailySchedule, DetailedTalk, Talk} from "@shared/daily-schedule.firestore";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {Replace} from "@shared/type-utils";

export type BreakTimeslotWithPotentiallyUnknownIcon = Replace<BreakTimeSlot, {
  break: Replace<BreakTimeSlot['break'], {
    icon: BreakTimeSlot['break']['icon'] | 'unknown'
  }>
}>

export type DescriptorableEvent<T extends Omit<ListableEvent, "websiteUrl">> = Omit<T, "eventFamily"|"eventName"|"websiteUrl"|"visibility"|"spaceToken">;

export interface FullEvent {
    id: string,
    conferenceDescriptor: DescriptorableEvent<ConferenceDescriptor>,
    info: DescriptorableEvent<ListableEvent>,
    daySchedules: DailySchedule[],
    talks: DetailedTalk[],
}

