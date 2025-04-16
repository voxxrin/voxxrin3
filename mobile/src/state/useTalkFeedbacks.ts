import {SpacedEventId} from "@/models/VoxxrinEvent";
import {collection, CollectionReference,} from "firebase/firestore";
import {db} from "@/state/firebase";
import {deferredVuefireUseCollection} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {TalkAttendeeFeedback} from "@shared/talk-feedbacks.firestore";
import {Ref} from "vue";
import {toCollectionReferenceArray} from "@/models/utils";
import {match} from "ts-pattern";
import {resolvedEventFirestorePath} from "@shared/utilities/event-utils";

function getTalkFeedbacksRef(spacedEventId: SpacedEventId|undefined, talkId: TalkId|undefined, talkFeedbackViewerToken: string|undefined) {
    if(!talkId || !talkId.value || !spacedEventId || !spacedEventId.eventId || !spacedEventId.eventId.value || !talkFeedbackViewerToken) {
        return undefined;
    }

    return collection(
      db,
      `${resolvedEventFirestorePath(spacedEventId.eventId.value, spacedEventId.spaceToken?.value)}/talks/${talkId.value}/feedbacks-access/${talkFeedbackViewerToken}/feedbacks`
    ) as CollectionReference<TalkAttendeeFeedback>
}
export function useTalkFeedbacks(
    spacedEventIdRef: Ref<SpacedEventId|undefined>,
    talkIdRef: Ref<TalkId|undefined>,
    talkFeedbackViewerTokenRef: Ref<string|undefined>
) {

    const firestoreTalkFeedbacksByPublicUserIdRef = deferredVuefireUseCollection(
        [spacedEventIdRef, talkIdRef, talkFeedbackViewerTokenRef],
        ([spacedEventId, talkId, talkFeedbackViewerToken]) =>
            toCollectionReferenceArray(getTalkFeedbacksRef(spacedEventId, talkId, talkFeedbackViewerToken)),
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
