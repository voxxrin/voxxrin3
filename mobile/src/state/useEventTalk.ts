import {
    createVoxxrinDetailedTalkFromFirestore,
    TalkId,
} from "@/models/VoxxrinTalk";
import {computed, unref, watch} from "vue";
import {DetailedTalk} from "../../../shared/dayly-schedule.firestore";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {collection, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Unreffable} from "@/views/vue-utils";
import {useDocument} from "vuefire";
import {createSharedComposable} from "@vueuse/core";


export function useEventTalk(
    conferenceDescriptorRef: Unreffable<VoxxrinConferenceDescriptor | undefined>,
    talkIdRef: Unreffable<TalkId | undefined>) {

    console.debug(`useEventTalk(${unref(conferenceDescriptorRef)?.id.value}, ${unref(talkIdRef)?.value})`)
    watch(() => unref(conferenceDescriptorRef), (newVal, oldVal) => {
        console.debug(`useEventTalk[conferenceDescriptorRef] updated from [${oldVal?.id.value}] to [${newVal?.id.value}]`)
    })
    watch(() => unref(talkIdRef), (newVal, oldVal) => {
        console.debug(`useEventTalk[talkIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    })

    const firestoreTalkDetailsSource = computed(() => {
        const conferenceDescriptor = unref(conferenceDescriptorRef),
            talkId = unref(talkIdRef);

        if(!conferenceDescriptor || !talkId || !talkId.value) {
            return undefined;
        }

        return doc(collection(doc(collection(db, 'events'), conferenceDescriptor.id.value), 'talks'), talkId.value) as DocumentReference<DetailedTalk>;
    });

    const firestoreTalkDetailsRef = useDocument(firestoreTalkDetailsSource);

    return {
        talkDetails: computed(() => {
            const conf = unref(conferenceDescriptorRef),
                firestoreTalkDetails = unref(firestoreTalkDetailsRef);

            if(!conf || !firestoreTalkDetails) {
                return undefined;
            }

            const talkDetails = createVoxxrinDetailedTalkFromFirestore(conf, firestoreTalkDetails);
            return talkDetails;
        })
    };
}

export function prepareEventTalks(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    talkIds: Array<TalkId>
) {
    talkIds.forEach(talkId => {
        useEventTalk(conferenceDescriptor, talkId);
    })
}

export const useSharedEventTalk = createSharedComposable(useEventTalk);
