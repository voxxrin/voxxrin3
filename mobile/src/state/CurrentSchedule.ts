import {Ref, computed, unref} from "vue";
import {DailySchedule} from "../../../shared/dayly-schedule.firestore";
import {createVoxxrinDailyScheduleFromFirestore} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DocumentReference, doc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {useFirestore} from "@vueuse/firebase";

export function useSchedule(
            conferenceDescriptorRef: Ref<VoxxrinConferenceDescriptor | undefined>, 
            dayIdRef: Ref<DayId | undefined>) {

    const document = computed(() => {
        const conf = unref(conferenceDescriptorRef),
            dayId = unref(dayIdRef);
        return conf && dayId && 
            (doc(db, `events/${conf.id.value}/days/${dayId.value}`) as DocumentReference<DailySchedule>)
    })

    const firestoreDailySchedule = useFirestore(document, undefined)

    return computed(() => {
        const conf = unref(conferenceDescriptorRef), 
            schedule = unref(firestoreDailySchedule);
        return conf && schedule && createVoxxrinDailyScheduleFromFirestore(conf, schedule)
    })
}