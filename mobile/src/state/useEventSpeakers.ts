import {computed, Ref, toValue} from "vue";
import {deferredVuefireUseDocument} from "@/views/vue-utils";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {resolvedEventFirestorePath} from "../../../shared/utilities/event-utils";
import {LineupSpeaker} from "../../../shared/event-lineup.firestore";
import {createVoxxrinSpeakerFromFirestore, SpeakerId, speakerMatchesSearchTerms} from "@/models/VoxxrinSpeaker";
import {CompletablePromiseQueue, sortBy} from "@/models/utils";
import {User} from "firebase/auth";
import {checkCache} from "@/services/Cachings";
import {Temporal} from "temporal-polyfill";
import {PERF_LOGGER} from "@/services/Logger";
import {loadSpeakerUrl} from "@/state/useEventTalk";
import {toValidFirebaseKey} from "../../../shared/utilities/firebase.utils";
import {match, P} from "ts-pattern";

export function useLineupSpeakers(eventDescriptorRef: Ref<VoxxrinConferenceDescriptor|undefined>, searchTermsRef: Ref<string|undefined>) {

  const firestoreAllSpeakersRef = deferredVuefireUseDocument([eventDescriptorRef],
    ([maybeEventDescriptor]) => allEventLineupSpeakersDoc(maybeEventDescriptor));

  return {
    speakers: computed(() => {
      const firestoreAllSpeakersLineup = toValue(firestoreAllSpeakersRef),
        eventDescriptor = toValue(eventDescriptorRef),
        searchTerms = toValue(searchTermsRef);

      if(!firestoreAllSpeakersLineup || !eventDescriptor) {
        return [];
      }

      const speakers = sortBy(
        [...Object.values(firestoreAllSpeakersLineup)]
          .map(fSpeaker => createVoxxrinSpeakerFromFirestore(eventDescriptor, fSpeaker))
          .filter(speaker => speakerMatchesSearchTerms(speaker, searchTerms)),
        sp => sp.fullName
      );
      return speakers;
    })
  }
}

export function useLineupSpeaker(eventDescriptorRef: Ref<VoxxrinConferenceDescriptor|undefined>, speakerIdRef: Ref<SpeakerId|undefined>) {

  const firestoreSpeakerRef = deferredVuefireUseDocument([eventDescriptorRef, speakerIdRef],
    ([eventDescriptor, speakerId]) => eventLineupSpeakerDocument(eventDescriptor, speakerId));

  return {
    speaker: computed(() => {
      const firestoreSpeaker = toValue(firestoreSpeakerRef),
        eventDescriptor = toValue(eventDescriptorRef);

      if(!firestoreSpeaker || !eventDescriptor) {
        return undefined;
      }

      const speaker = createVoxxrinSpeakerFromFirestore(eventDescriptor, firestoreSpeaker);
      return speaker;
    })
  }
}

export function allEventLineupSpeakersDoc(maybeEventDescriptor: VoxxrinConferenceDescriptor|undefined) {
  if(!maybeEventDescriptor || !maybeEventDescriptor.id || !maybeEventDescriptor.id.value) {
    return undefined;
  }

  return doc(db, `${resolvedEventFirestorePath(maybeEventDescriptor.id.value, maybeEventDescriptor.spaceToken?.value)}/speakers-allInOne/self`) as DocumentReference<Record<string, LineupSpeaker>>;
}

export function eventLineupSpeakerDocument(eventDescriptor: VoxxrinConferenceDescriptor|undefined, speakerId: SpeakerId|undefined) {
  if(!eventDescriptor || !eventDescriptor.id || !eventDescriptor.id.value || !speakerId || !speakerId.value) {
    return undefined;
  }

  return doc(db,
    `${resolvedEventFirestorePath(eventDescriptor.id.value, eventDescriptor.spaceToken?.value)}/speakers/${toValidFirebaseKey(speakerId.value)}`
    ) as DocumentReference<LineupSpeaker>;
}

export async function prepareEventSpeakers(user: User, conferenceDescriptor: VoxxrinConferenceDescriptor, promisesQueue: CompletablePromiseQueue) {
  promisesQueue.add(() => checkCache(`eventSpeakersPreparation(eventId=${conferenceDescriptor.id.value})`,
    Temporal.Duration.from({ hours: 24 }), // No need to have frequent refreshes for list of speakers...
    async () => {
      PERF_LOGGER.debug(`eventTalkPreparation(eventId=${conferenceDescriptor.id.value})`)

      const maybeAllSpeakersDoc = allEventLineupSpeakersDoc(conferenceDescriptor);
      const allSpeakersById = await match(maybeAllSpeakersDoc)
        .with(P.nullish, async () => ({} as Record<string, LineupSpeaker>))
        .otherwise(async allSpeakersDoc => (await getDoc(allSpeakersDoc)).data() || {});

      promisesQueue.addAll(Object.values(allSpeakersById).map(speaker => () => {
        if(speaker.photoUrl) {
          return loadSpeakerUrl(speaker.photoUrl);
        }
      }), {priority: 100 });
    }), { priority: 1000 });
}
