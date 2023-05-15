import {
    createVoxxrinDetailedTalkFromFirestore,
    TalkId,
} from "@/models/VoxxrinTalk";
import {computed, unref} from "vue";
import {DetailedTalk} from "../../../shared/dayly-schedule.firestore";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {useFirestore} from "@vueuse/firebase";
import {
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {Unreffable} from "@/views/vue-utils";


export function useEventTalk(
    conferenceDescriptorRef: Unreffable<VoxxrinConferenceDescriptor | undefined>,
    // TODO: Remove this once we put start/end times on /events/:eventId/talks/:talkId firestore entry
    dailyScheduleRef: Unreffable<VoxxrinDailySchedule | undefined>,
    talkIdRef: Unreffable<TalkId | undefined>) {

    const document = computed(() => {
        const conf = unref(conferenceDescriptorRef),
            talkId = unref(talkIdRef);
        return conf && talkId &&
            (doc(db, `events/${conf.id.value}/talks/${talkId.value}`) as DocumentReference<DetailedTalk>)
    })

    const firestoreDetailedTalk = useFirestore(document, undefined)

    return {
        talkDetails: computed(() => {
            const conf = unref(conferenceDescriptorRef),
                dailySchedule = unref(dailyScheduleRef),
                talkDetails = unref(firestoreDetailedTalk);
            return conf && talkDetails && dailySchedule
                && createVoxxrinDetailedTalkFromFirestore(conf, dailySchedule, talkDetails)
        })
    }
}
