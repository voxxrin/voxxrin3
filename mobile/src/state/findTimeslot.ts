import {
    createVoxxrinDailyScheduleFromFirestore, findTalksTimeslotById,
    findTalksTimeslotContainingTalk,
    getTimeslotLabel, ScheduleTimeSlotId,
    VoxxrinScheduleTalksTimeSlot,
} from "@/models/VoxxrinSchedule";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {dailyScheduleDocument} from "@/state/useSchedule";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {getDoc} from "firebase/firestore";
import {DayId} from "@/models/VoxxrinDay";

export type LabelledTimeslot = VoxxrinScheduleTalksTimeSlot & {label: ReturnType<typeof getTimeslotLabel>};
export type LabelledTimeslotWithOverlappings = {
    labelledTimeslot: LabelledTimeslot,
    overlappingLabelledTimeslots: LabelledTimeslot[]
}
export type DailyLabelledTimeslotWithTalk = {
    dayId: DayId,
    labelledTimeslot: LabelledTimeslot,
    talk: VoxxrinTalk
}

export async function findLabelledTimeslotWithOverlappingsForTimeslotId(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    timeslotId: ScheduleTimeSlotId): Promise<LabelledTimeslotWithOverlappings|undefined> {

    const labelledTimeslotWithOverlappings = (await Promise.all(conferenceDescriptor.days.map(async day => {
        const maybeDailyScheduleDocRef = dailyScheduleDocument(conferenceDescriptor, day.id);
        if(!maybeDailyScheduleDocRef) {
            return undefined;
        }

        const maybeDailySchedule = (await getDoc(maybeDailyScheduleDocRef)).data();
        if(!maybeDailySchedule) {
            return undefined;
        }

        const voxxrinDailySchedule = createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor, maybeDailySchedule);
        const timeslot = findTalksTimeslotById(voxxrinDailySchedule, timeslotId);

        if(!timeslot || timeslot.type !== 'talks') {
            return undefined;
        }

        const timeslotLabel = getTimeslotLabel(timeslot);
        const overlappingLabelledTimeslots = timeslot.overlappingTimeSlots.map(overlappingTimeslotId => {
            const overlappingTimeslot = findTalksTimeslotById(voxxrinDailySchedule, overlappingTimeslotId);
            if(!overlappingTimeslot) {
                throw new Error(`Unexpected error: overlapping timeslot not found for id ${overlappingTimeslotId.value}`)
            }

            const overlappingLabbeledTimeslot: LabelledTimeslot = {
                ...overlappingTimeslot,
                label: getTimeslotLabel(overlappingTimeslot)
            }
            return overlappingLabbeledTimeslot;
        })

        const result: LabelledTimeslotWithOverlappings = {
            labelledTimeslot: {
                ...timeslot,
                label: timeslotLabel,
            },
            overlappingLabelledTimeslots
        };
        return result;
    }))).find(labelledTimeslotAndScheduleAndTalkRef => !!labelledTimeslotAndScheduleAndTalkRef);

    return labelledTimeslotWithOverlappings;
}

export async function findLabelledTimeslotContainingTalk(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    talkId: TalkId): Promise<DailyLabelledTimeslotWithTalk|undefined> {

    const labelledTimeslot = (await Promise.all(conferenceDescriptor.days.map(async day => {
        const maybeDailyScheduleDocRef = dailyScheduleDocument(conferenceDescriptor, day.id);
        if(!maybeDailyScheduleDocRef) {
            return undefined;
        }

        const maybeDailySchedule = (await getDoc(maybeDailyScheduleDocRef)).data();
        if(!maybeDailySchedule) {
            return undefined;
        }

        const voxxrinDailySchedule = createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor, maybeDailySchedule);
        const maybeTalkAndTimeslot = findTalksTimeslotContainingTalk(voxxrinDailySchedule, talkId);
        if(!maybeTalkAndTimeslot) {
            return undefined;
        }

        const timeslotLabel = getTimeslotLabel(maybeTalkAndTimeslot.timeslot);
        const labelledTimeslot: DailyLabelledTimeslotWithTalk = {
            dayId: day.id,
            labelledTimeslot: {
                ...maybeTalkAndTimeslot.timeslot,
                label: timeslotLabel
            },
            talk: maybeTalkAndTimeslot.talk
        }

        return labelledTimeslot;
    }))).find(labelledTimeslotAndScheduleAndTalkRef => !!labelledTimeslotAndScheduleAndTalkRef);

    return labelledTimeslot;
}
