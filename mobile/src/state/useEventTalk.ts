import {
    createVoxxrinDetailedTalkFromFirestore,
    TalkId,
} from "@/models/VoxxrinTalk";
import {computed, Ref, unref, watch} from "vue";
import {DetailedTalk} from "../../../shared/daily-schedule.firestore";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {collection, doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {
    deferredVuefireUseDocument
} from "@/views/vue-utils";
import {createSharedComposable} from "@vueuse/core";
import {EventId} from "@/models/VoxxrinEvent";
import {PERF_LOGGER} from "@/services/Logger";
import {DayId} from "@/models/VoxxrinDay";
import {Temporal} from "temporal-polyfill";
import {checkCache} from "@/services/Cachings";
import {CompletablePromiseQueue} from "@/models/utils";


function getTalkDetailsRef(eventId: EventId|undefined, talkId: TalkId|undefined) {
    if(!eventId || !eventId.value || !talkId || !talkId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(db, 'events'), eventId.value), 'talks'), talkId.value) as DocumentReference<DetailedTalk>;
}

export function useEventTalk(
    conferenceDescriptorRef: Ref<VoxxrinConferenceDescriptor | undefined>,
    talkIdRef: Ref<TalkId | undefined>) {

    PERF_LOGGER.debug(() => `useEventTalk(${unref(conferenceDescriptorRef)?.id.value}, ${unref(talkIdRef)?.value})`)
    watch(() => unref(conferenceDescriptorRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useEventTalk[conferenceDescriptorRef] updated from [${oldVal?.id.value}] to [${newVal?.id.value}]`)
    }, {immediate: true})
    watch(() => unref(talkIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useEventTalk[talkIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreTalkDetailsRef = deferredVuefireUseDocument([conferenceDescriptorRef, talkIdRef],
        ([conferenceDescriptor, talkId]) => getTalkDetailsRef(conferenceDescriptor?.id, talkId))

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

export async function prepareEventTalks(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    dayId: DayId,
    talkIds: Array<TalkId>,
    promisesQueue: CompletablePromiseQueue
) {
    return checkCache(`eventTalksPreparation(eventId=${conferenceDescriptor.id.value}, dayId=${dayId.value})`, Temporal.Duration.from({ hours: 6 }), async () => {
        PERF_LOGGER.debug(`prepareEventTalks(eventId=${conferenceDescriptor.id.value}, talkIds=${JSON.stringify(talkIds.map(id => id.value))})`)

        promisesQueue.addAll(talkIds.map(talkId => {
          return async () => {
            const talkDetailsRef = getTalkDetailsRef(conferenceDescriptor.id, talkId);
            if(talkDetailsRef) {
              await getDoc(talkDetailsRef);
              PERF_LOGGER.debug(`getDoc(${talkDetailsRef.path})`)
            }
          }
        }))
    });
}

export const useSharedEventTalk = createSharedComposable(useEventTalk);
