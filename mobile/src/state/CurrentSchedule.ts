import {ref, watch} from "vue";
import {
    DailySchedule,
} from "../../../shared/dayly-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/state/firebase";


const CURRENT_SCHEDULE = ref<VoxxrinDailySchedule|undefined>(undefined);

export const useCurrentSchedule = () => CURRENT_SCHEDULE.value;

export const watchCurrentSchedule = (callback: (currentSchedule: (VoxxrinDailySchedule | undefined)) => void,) => {
    watch(CURRENT_SCHEDULE, callback, {immediate: true});
}

export function unsetCurrentSchedule() {
    CURRENT_SCHEDULE.value = undefined;
}

export const fetchSchedule = (conferenceDescriptor: VoxxrinConferenceDescriptor, dayId: DayId) => {
    // Avoiding to fetch schedule if the one already loaded matches the one expected
    if(
        !CURRENT_SCHEDULE.value?.eventId.isSameThan(conferenceDescriptor.id)
        || !CURRENT_SCHEDULE.value?.day.isSameThan(dayId)
    ) {
        const d = doc(db, `events/${conferenceDescriptor.id.value}/days/${dayId.value}`)
        const unsubscribe = onSnapshot(d, docSnapshot => {
                const firestoreDailySchedule: DailySchedule = docSnapshot.data() as DailySchedule
                console.debug(`timeslots fetched:`, firestoreDailySchedule.timeSlots)
                CURRENT_SCHEDULE.value = createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor, firestoreDailySchedule);
            }, err => {
                console.log(`Encountered error: ${err}`);
            });

        // TODO: see how to bind the unsubscribe properly in vue
    }
}
