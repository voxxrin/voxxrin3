import {
    createVoxxrinDetailedTalkFromFirestore,
    TalkId,
} from "@/models/VoxxrinTalk";
import {computed, unref, watch} from "vue";
import {DetailedTalk} from "../../../shared/daily-schedule.firestore";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {collection, doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Unreffable} from "@/views/vue-utils";
import {useDocument} from "vuefire";
import {createSharedComposable} from "@vueuse/core";
import {EventId} from "@/models/VoxxrinEvent";
import {PERF_LOGGER} from "@/services/Logger";
import {DayId} from "@/models/VoxxrinDay";
import {Temporal} from "temporal-polyfill";
import {checkCache} from "@/services/Cachings";


function getTalkDetailsRef(eventId: EventId, talkId: TalkId) {
    return doc(collection(doc(collection(db, 'events'), eventId.value), 'talks'), talkId.value) as DocumentReference<DetailedTalk>;
}

export function useEventTalk(
    conferenceDescriptorRef: Unreffable<VoxxrinConferenceDescriptor | undefined>,
    talkIdRef: Unreffable<TalkId | undefined>) {

    PERF_LOGGER.debug(() => `useEventTalk(${unref(conferenceDescriptorRef)?.id.value}, ${unref(talkIdRef)?.value})`)
    watch(() => unref(conferenceDescriptorRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useEventTalk[conferenceDescriptorRef] updated from [${oldVal?.id.value}] to [${newVal?.id.value}]`)
    }, {immediate: true})
    watch(() => unref(talkIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useEventTalk[talkIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreTalkDetailsSource = computed(() => {
        const conferenceDescriptor = unref(conferenceDescriptorRef),
            talkId = unref(talkIdRef);

        if(!conferenceDescriptor || !talkId || !talkId.value) {
            return undefined;
        }

        return getTalkDetailsRef(conferenceDescriptor.id, talkId);
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

export async function prepareEventTalks(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    dayId: DayId,
    talkIds: Array<TalkId>
) {
    return checkCache(`eventTalksPreparation(eventId=${conferenceDescriptor.id.value}, dayId=${dayId.value})`, Temporal.Duration.from({ hours: 6 }), async () => {
        PERF_LOGGER.debug(`prepareEventTalks(eventId=${conferenceDescriptor.id.value}, talkIds=${JSON.stringify(talkIds.map(id => id.value))})`)
        await Promise.all(talkIds.map(async talkId => {
            const talkDetailsRef = getTalkDetailsRef(conferenceDescriptor.id, talkId);
            await getDoc(talkDetailsRef);
            PERF_LOGGER.debug(`getDoc(${talkDetailsRef.path})`)
        }))
    });
}

export const useSharedEventTalk = createSharedComposable(useEventTalk);
