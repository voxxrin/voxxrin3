import {Ref, ref, watchEffect} from "vue";
import {DailySchedule} from "../../../shared/dayly-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {doc, onSnapshot} from "firebase/firestore";
import {db} from "@/state/firebase";


const CURRENT_SCHEDULE = ref<VoxxrinDailySchedule|undefined>(undefined);
let clearFirestoreWatch = () => {}

export function unsetCurrentSchedule() {
    clearFirestoreWatch();
    CURRENT_SCHEDULE.value = undefined;
}

export const useSchedule = (conferenceDescriptor: Ref<VoxxrinConferenceDescriptor | undefined>, dayId: Ref<DayId | undefined>) => {
    clearFirestoreWatch();
    watchEffect(() => {
        clearFirestoreWatch();
        if (conferenceDescriptor.value && dayId.value) {
            const docPath = `events/${conferenceDescriptor.value.id.value}/days/${dayId.value.value}`
            const d = doc(db, docPath)
            clearFirestoreWatch = onSnapshot(d, docSnapshot => {
                    const firestoreDailySchedule: DailySchedule = docSnapshot.data() as DailySchedule
                    console.debug(`timeslots fetched from  ${docPath}:`, firestoreDailySchedule.timeSlots);
                    CURRENT_SCHEDULE.value = 
                        createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor.value!, firestoreDailySchedule);
                }, err => {
                    console.log(`Encountered error: ${err}`);
                });
        } else {
            CURRENT_SCHEDULE.value = undefined;
        }
    })
    return CURRENT_SCHEDULE
}