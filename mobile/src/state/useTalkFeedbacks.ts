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
import {toCollectionReferenceArray} from "@/models/utils";
import {match} from "ts-pattern";

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

    const firestoreTalkFeedbacksByPublicUserIdRef = deferredVuefireUseCollection(
        [eventIdRef, talkIdRef, talkFeedbackViewerTokenRef],
        ([eventId, talkId, talkFeedbackViewerToken]) =>
            toCollectionReferenceArray(getTalkFeedbacksRef(eventId, talkId, talkFeedbackViewerToken)),
        firestoreEvent => firestoreEvent,
        () => {},
        (change, docId, collectionRef) => {
            match(change)
                .with({type:'created'}, change => collectionRef.value.set(docId, change.createdDoc))
                .with({type:'updated'}, change => collectionRef.value.set(docId, change.updatedDoc))
                .with({type:'deleted'}, change => collectionRef.value.delete(docId))
                .exhaustive()
        }
    )

    return {
        firestoreTalkFeedbacksByPublicUserIdRef
    };
}
