import {
    createVoxxrinDetailedTalkFromFirestore,
    TalkId,
} from "@/models/VoxxrinTalk";
import {computed, unref} from "vue";
import {DetailedTalk} from "../../../shared/dayly-schedule.firestore";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {collection, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {
    VoxxrinDailySchedule
} from "@/models/VoxxrinSchedule";
import {Unreffable} from "@/views/vue-utils";
import {useDocument} from "vuefire";


export function useEventTalk(
    conferenceDescriptorRef: Unreffable<VoxxrinConferenceDescriptor | undefined>,
    // TODO: Remove this once we put start/end times on /events/:eventId/talks/:talkId firestore entry
    dailyScheduleRef: Unreffable<VoxxrinDailySchedule | undefined>,
    talkIdRef: Unreffable<TalkId | undefined>) {

    const firestoreTalkDetailsSource = computed(() => {
        const conferenceDescriptor = unref(conferenceDescriptorRef),
            talkId = unref(talkIdRef);

        if(!conferenceDescriptor || !talkId) {
            return undefined;
        }

        return doc(collection(doc(collection(db, 'events'), conferenceDescriptor.id.value), 'talks'), talkId.value) as DocumentReference<DetailedTalk>;
    });

    const firestoreTalkDetailsRef = useDocument(firestoreTalkDetailsSource);

    return {
        talkDetails: computed(() => {
            const conf = unref(conferenceDescriptorRef),
                dailySchedule = unref(dailyScheduleRef),
                firestoreTalkDetails = unref(firestoreTalkDetailsRef);

            if(!conf || !dailySchedule || !firestoreTalkDetails) {
                return undefined;
            }

            const talkDetails = createVoxxrinDetailedTalkFromFirestore(conf, dailySchedule, firestoreTalkDetails);
            return talkDetails;
        })
    };
}
