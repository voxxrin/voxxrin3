import {createVoxxrinDetailedTalkFromFirestore, TalkId, VoxxrinTalk,} from "@/models/VoxxrinTalk";
import {computed, Ref, unref, watch} from "vue";
import {DetailedTalk} from "../../../shared/daily-schedule.firestore";
import {maybeSpacedEventIdOf, spacedEventIdOf, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {deferredVuefireUseDocument} from "@/views/vue-utils";
import {createSharedComposable} from "@vueuse/core";
import {SpacedEventId} from "@/models/VoxxrinEvent";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {DayId} from "@/models/VoxxrinDay";
import {Temporal} from "temporal-polyfill";
import {checkCache, preloadPicture} from "@/services/Cachings";
import {CompletablePromiseQueue} from "@/models/utils";
import {resolvedEventFirestorePath} from "../../../shared/utilities/event-utils";


function getTalkDetailsRef(spacedEventId: SpacedEventId|undefined, talkId: TalkId|undefined) {
    if(!spacedEventId || !spacedEventId.eventId || !spacedEventId.eventId.value || !talkId || !talkId.value) {
        return undefined;
    }

    return doc(
      db,
      `${resolvedEventFirestorePath(spacedEventId.eventId.value, spacedEventId.spaceToken?.value)}/talks/${talkId.value}`
    ) as DocumentReference<DetailedTalk>;
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
        ([conferenceDescriptor, talkId]) => getTalkDetailsRef(maybeSpacedEventIdOf(conferenceDescriptor), talkId))

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

export async function prepareEventTalk(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    dayId: DayId,
    talk: VoxxrinTalk,
    promisesQueue: CompletablePromiseQueue,
    queuePriority: number
) {

  const talkDetailsRef = getTalkDetailsRef(spacedEventIdOf(conferenceDescriptor), talk.id);
  if(talkDetailsRef) {
    await getDoc(talkDetailsRef);
    PERF_LOGGER.debug(`getDoc(${talkDetailsRef.path})`)
  }

  await checkCache(`eventTalkPreparation(eventId=${conferenceDescriptor.id.value}, dayId=${dayId.value}, talkId=${talk.id.value})(speaker pictures)`,
    Temporal.Duration.from({ hours: 24 }), // No need to have frequent refreshes for speaker urls...
    async () => {
        PERF_LOGGER.debug(`eventTalkPreparation(eventId=${conferenceDescriptor.id.value}, dayId=${dayId.value}, talkId=${talk.id.value})(speaker pictures)`)

        promisesQueue.addAll(talk.speakers.map(speaker => () => {
          if(speaker.photoUrl) {
            return loadSpeakerUrl(talk, speaker.photoUrl);
          }
        }), {priority: queuePriority });
    });
}

const IN_MEMORY_SPEAKER_URL_PRELOADINGS = new Set<string>();
async function loadSpeakerUrl(talk: VoxxrinTalk, speakerUrl: string) {
  const LOGGER = Logger.named(`loadTalkSpeakerUrl(${talk.id.value}): ${speakerUrl}`);

  return new Promise(async resolve => {
    if(IN_MEMORY_SPEAKER_URL_PRELOADINGS.has(speakerUrl)) {
      LOGGER.debug(`Speaker url already preloaded, skipping: ${speakerUrl}`)
      resolve(null);
    } else {
      IN_MEMORY_SPEAKER_URL_PRELOADINGS.add(speakerUrl);

      await preloadPicture(speakerUrl)
      resolve(null);
    }
  })
}

export const useSharedEventTalk = createSharedComposable(useEventTalk);
