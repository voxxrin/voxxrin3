import {ref, watch} from "vue";
import {
    DailySchedule,
} from "../../../shared/dayly-schedule.firestore";
import {DeepReadonly} from "ts-essentials";
import {
    createVoxxrinDailyScheduleFromFirestore,
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {Day} from "@/models/VoxxrinDay";
import {EventId} from "@/models/VoxxrinEvent";


const CURRENT_SCHEDULE = ref<DeepReadonly<VoxxrinDailySchedule>|undefined>(undefined);

export const useCurrentSchedule = () => CURRENT_SCHEDULE.value;

export const watchCurrentSchedule = (
    callback: (currentSchedule: (DeepReadonly<VoxxrinDailySchedule> | undefined)) => void,
    onUnmountedHook: (hook: () => any) => (false | Function | undefined)
) => {
    const cleaner = watch(CURRENT_SCHEDULE, callback);
    onUnmountedHook(cleaner);
}

export const fetchSchedule = async (eventId: EventId, day: Day) => {
    // Avoiding to fetch schedule if the one already loaded matches the one expected
    if(
        !CURRENT_SCHEDULE.value?.eventId.isSameThan(eventId)
        || !CURRENT_SCHEDULE.value?.day.isSameThan(day)
    ) {
        const firestoreDailySchedule: DailySchedule = await fetch(`/data/dvbe22/days/${day.value}.json`).then(resp => resp.json());
        console.log(`timeslots fetched:`, firestoreDailySchedule.timeSlots)

        defineCurrentScheduleFromFirestore(eventId, firestoreDailySchedule);
    }
}

const defineCurrentScheduleFromFirestore = (eventId: EventId, firestoreSchedule: DailySchedule) => {
    const voxxrinSchedule = createVoxxrinDailyScheduleFromFirestore(eventId, firestoreSchedule);
    CURRENT_SCHEDULE.value = voxxrinSchedule;
}
