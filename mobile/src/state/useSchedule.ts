import {computed, unref} from "vue";
import {DailySchedule} from "../../../shared/dayly-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DocumentReference, doc, collection} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Unreffable} from "@/views/vue-utils";
import {useDocument} from "vuefire";

export function useSchedule(
            conferenceDescriptorRef: Unreffable<VoxxrinConferenceDescriptor | undefined>,
            dayIdRef: Unreffable<DayId | undefined>) {

    const firestoreDailyScheduleSource = computed(() => {
        const conferenceDescriptor = unref(conferenceDescriptorRef),
            dayId = unref(dayIdRef);

        if(!conferenceDescriptor || !dayId) {
            return undefined;
        }

        return doc(collection(doc(collection(db, 'events'), conferenceDescriptor.id.value), 'days'), dayId.value) as DocumentReference<DailySchedule>;
    });

    const firestoreDailyScheduleRef = useDocument(firestoreDailyScheduleSource)

    return {
        schedule: computed(() => {
            const conferenceDescriptor = unref(conferenceDescriptorRef),
                firestoreDailySchedule = unref(firestoreDailyScheduleRef);

            if(!conferenceDescriptor || !firestoreDailySchedule) {
                return undefined;
            }

            const schedule = createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor, firestoreDailySchedule)
            return schedule;
        })
    };
}
