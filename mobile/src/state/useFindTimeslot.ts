import {computed, unref} from "vue";
import {
    findTalksTimeslotById, findTalksTimeslotContainingTalk,
    getTimeslotLabel,
    ScheduleTimeSlotId, VoxxrinScheduleTalksTimeSlot,
} from "@/models/VoxxrinSchedule";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useSchedule} from "@/state/useSchedule";
import {TalkId} from "@/models/VoxxrinTalk";

export type LabelledTimeslot = VoxxrinScheduleTalksTimeSlot & {label: ReturnType<typeof getTimeslotLabel>};

export function useFindLabelledTimeslot(
            conferenceDescriptor: VoxxrinConferenceDescriptor,
            timeslotId: ScheduleTimeSlotId) {

    const scheduleRefs = conferenceDescriptor.days.map(day => {
        const { schedule: scheduleRef } = useSchedule(conferenceDescriptor, day.id)
        return scheduleRef;
    })

    const labelledTimeslotAndScheduleRef = computed(() => {
        const schedules = scheduleRefs.map(unref);

        const maybeTimeslotAndSchedule = schedules.map(schedule => {
            if(!schedule) {
                return undefined;
            }

            const timeslot = findTalksTimeslotById(schedule, timeslotId);
            if(!timeslot) {
                return undefined;
            }

            return {timeslot, schedule};
        }).find(timeslotAndSchedule => !!timeslotAndSchedule);

        if(!maybeTimeslotAndSchedule) {
            return undefined;
        }

        const labelledTimeslot: LabelledTimeslot = {
            ...maybeTimeslotAndSchedule.timeslot,
            label: getTimeslotLabel(maybeTimeslotAndSchedule.timeslot)
        }

        return { labelledTimeslot, schedule: maybeTimeslotAndSchedule.schedule };
    })

    return {
        labelledTimeslotAndScheduleRef
    };
}

export function useFindLabelledTimeslotContainingTalk(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    talkId: TalkId) {

    const scheduleRefs = conferenceDescriptor.days.map(day => {
        const { schedule: scheduleRef } = useSchedule(conferenceDescriptor, day.id)
        return scheduleRef;
    })

    const labelledTimeslotAndScheduleAndTalkRef = computed(() => {
        const schedules = scheduleRefs.map(unref);

        const maybeTimeslotAndScheduleAndTalk = schedules.map(schedule => {
            if(!schedule) {
                return undefined;
            }

            const maybeTalkAndTimeslot = findTalksTimeslotContainingTalk(schedule, talkId);
            if(!maybeTalkAndTimeslot) {
                return undefined;
            }

            return {...maybeTalkAndTimeslot, schedule};
        }).find(timeslotAndSchedule => !!timeslotAndSchedule);

        if(!maybeTimeslotAndScheduleAndTalk) {
            return undefined;
        }

        const labelledTimeslot: LabelledTimeslot = {
            ...maybeTimeslotAndScheduleAndTalk.timeslot,
            label: getTimeslotLabel(maybeTimeslotAndScheduleAndTalk.timeslot)
        }

        return { labelledTimeslot, schedule: maybeTimeslotAndScheduleAndTalk.schedule, talk: maybeTimeslotAndScheduleAndTalk.talk };
    })

    return {
        labelledTimeslotAndScheduleAndTalkRef
    };
}
