import {EventId} from "@/models/VoxxrinEvent";
import {
    collection, CollectionReference,
    doc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {
    deferredVuefireUseCollection
} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {TalkAttendeeFeedback} from "../../../shared/talk-feedbacks.firestore";
import {Ref} from "vue";

function getTalkFeedbacksRef(eventId: EventId|undefined, talkId: TalkId|undefined, talkFeedbackViewerToken: string|undefined) {
    if(!talkId || !talkId.value || !eventId || !eventId.value || !talkFeedbackViewerToken) {
        return undefined;
    }

    return collection(doc(collection(doc(collection(doc(collection(db,
                    'events'), eventId.value),
                'talks'), talkId.value),
            'feedbacks-access'), talkFeedbackViewerToken),
        'feedbacks'
    ) as CollectionReference<TalkAttendeeFeedback>
}
export function useTalkFeedbacks(
    eventIdRef: Ref<EventId|undefined>,
    talkIdRef: Ref<TalkId|undefined>,
    talkFeedbackViewerTokenRef: Ref<string|undefined>
) {

    const firestoreTalkFeedbacksRef = deferredVuefireUseCollection([eventIdRef, talkIdRef, talkFeedbackViewerTokenRef],
        ([eventId, talkId, talkFeedbackViewerToken]) => getTalkFeedbacksRef(eventId, talkId, talkFeedbackViewerToken))

    return {
        talkFeedbacksRef: firestoreTalkFeedbacksRef
    };
}
