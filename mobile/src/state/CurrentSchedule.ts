import {ref, watch} from "vue";
import {
    DailySchedule,
} from "../../../shared/dayly-schedule.firestore";
import {DeepReadonly} from "ts-essentials";
import {
    createVoxxrinDailyScheduleFromFirestore,
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {EventId} from "@/models/VoxxrinEvent";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";


const CURRENT_SCHEDULE = ref<DeepReadonly<VoxxrinDailySchedule>|undefined>(undefined);

export const useCurrentSchedule = () => CURRENT_SCHEDULE.value;

export const watchCurrentSchedule = (
    callback: (currentSchedule: (DeepReadonly<VoxxrinDailySchedule> | undefined)) => void,
    onUnmountedHook: (hook: () => any) => (false | Function | undefined)
) => {
    const cleaner = watch(CURRENT_SCHEDULE, callback);
    onUnmountedHook(cleaner);
}

export const fetchSchedule = async (conferenceDescriptor: VoxxrinConferenceDescriptor, dayId: DayId) => {
    // Avoiding to fetch schedule if the one already loaded matches the one expected
    if(
        !CURRENT_SCHEDULE.value?.eventId.isSameThan(conferenceDescriptor.id)
        || !CURRENT_SCHEDULE.value?.day.isSameThan(dayId)
    ) {
        const day = conferenceDescriptor.days.find(d => d.id.isSameThan(dayId))
        if(!day) {
            throw new Error(`No day found in conference descriptor ${conferenceDescriptor.id.value} matching day=${dayId.value}`)
        }
        const firestoreDailySchedule: DailySchedule = await fetch(`/data/${conferenceDescriptor.id.value}/days/${dayId.value}.json`).then(resp => resp.json());
        console.log(`timeslots fetched:`, firestoreDailySchedule.timeSlots)

        defineCurrentScheduleFromFirestore(conferenceDescriptor.id, firestoreDailySchedule);
    }
}

const defineCurrentScheduleFromFirestore = (eventId: EventId, firestoreSchedule: DailySchedule) => {
    const voxxrinSchedule = createVoxxrinDailyScheduleFromFirestore(eventId, firestoreSchedule);
    CURRENT_SCHEDULE.value = voxxrinSchedule;
}
