import {ref, watch} from "vue";
import {
    DailySchedule,
} from "../../../shared/dayly-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {findVoxxrinDayById, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useFetchJsonDebouncer} from "@/state/state-utilities";


const CURRENT_SCHEDULE = ref<VoxxrinDailySchedule|undefined>(undefined);

export const useCurrentSchedule = () => CURRENT_SCHEDULE.value;

export const watchCurrentSchedule = (callback: (currentSchedule: (VoxxrinDailySchedule | undefined)) => void,) => {
    watch(CURRENT_SCHEDULE, callback, {immediate: true});
}

export const fetchSchedule = async (conferenceDescriptor: VoxxrinConferenceDescriptor, dayId: DayId) => {
    // Avoiding to fetch schedule if the one already loaded matches the one expected
    if(
        !CURRENT_SCHEDULE.value?.eventId.isSameThan(conferenceDescriptor.id)
        || !CURRENT_SCHEDULE.value?.day.isSameThan(dayId)
    ) {
        const day = findVoxxrinDayById(conferenceDescriptor, dayId)
        const firestoreDailySchedule: DailySchedule = await useFetchJsonDebouncer(
            'daily-schedule',
            `events/${conferenceDescriptor.id.value}/days/${day.id.value}`,
            `/data/${conferenceDescriptor.id.value}/days/${day.id.value}.json`
        );
        console.debug(`timeslots fetched:`, firestoreDailySchedule.timeSlots)

        defineCurrentScheduleFromFirestore(conferenceDescriptor, firestoreDailySchedule);
    }
}

const defineCurrentScheduleFromFirestore = (event: VoxxrinConferenceDescriptor, firestoreSchedule: DailySchedule) => {
    const voxxrinSchedule = createVoxxrinDailyScheduleFromFirestore(event, firestoreSchedule);
    CURRENT_SCHEDULE.value = voxxrinSchedule;
}
