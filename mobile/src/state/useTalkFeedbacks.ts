import {EventId} from "@/models/VoxxrinEvent";
import {computed, unref} from "vue";
import {useCollection} from "vuefire";
import {
    collection, CollectionReference,
    doc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Unreffable} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {TalkAttendeeFeedback} from "../../../shared/talk-feedbacks.firestore";

export function useTalkFeedbacks(
    eventIdRef: Unreffable<EventId|undefined>,
    talkIdRef: Unreffable<TalkId|undefined>,
    talkFeedbackViewerTokenRef: Unreffable<string|undefined>
) {

    const firestoreTalkFeedbacksSource = computed(() => {
        const eventId = unref(eventIdRef),
            talkId = unref(talkIdRef),
            talkFeedbackViewerToken = unref(talkFeedbackViewerTokenRef);

        if(!talkId || !eventId || !talkFeedbackViewerToken) {
            return undefined;
        }

        return collection(doc(collection(doc(collection(doc(collection(db,
            'events'), eventId.value),
            'talks'), talkId.value),
            'feedbacks-access'), talkFeedbackViewerToken),
            'feedbacks'
        ) as CollectionReference<TalkAttendeeFeedback>
    });

    const firestoreTalkFeedbacksRef = useCollection(firestoreTalkFeedbacksSource);

    return {
        talkFeedbacksRef: firestoreTalkFeedbacksRef
    };
}
