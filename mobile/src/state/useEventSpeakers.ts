import {computed, Ref, toValue} from "vue";
import {deferredVuefireUseCollection, deferredVuefireUseDocument} from "@/views/vue-utils";
import {VoxxrinConferenceDescriptor, VoxxrinLanguaceCode} from "@/models/VoxxrinConferenceDescriptor";
import {collection, CollectionReference, doc, DocumentReference, getDocs } from "firebase/firestore";
import {db} from "@/state/firebase";
import {resolvedEventFirestorePath} from "../../../shared/utilities/event-utils";
import {LineupSpeaker} from "../../../shared/event-lineup.firestore";
import {createVoxxrinSpeakerFromFirestore, SpeakerId, speakerMatchesSearchTerms} from "@/models/VoxxrinSpeaker";
import {match} from "ts-pattern";
import {CompletablePromiseQueue, sortBy} from "@/models/utils";
import {User} from "firebase/auth";
import {checkCache} from "@/services/Cachings";
import {Temporal} from "temporal-polyfill";
import {PERF_LOGGER} from "@/services/Logger";
import {loadSpeakerUrl} from "@/state/useEventTalk";

export function useLineupSpeakers(eventDescriptorRef: Ref<VoxxrinConferenceDescriptor|undefined>, searchTermsRef: Ref<string|undefined>) {

  const firestoreSpeakersRef = deferredVuefireUseCollection([ eventDescriptorRef ],
    ([eventDescriptor]) => eventLineupSpeakersCollections(eventDescriptor),
    (firestoreSpeaker: LineupSpeaker) => firestoreSpeaker,
    () => {},
    (change, speakerId, collectionRef) => {
      match(change)
        .with({type:'created'}, change => collectionRef.value.set(speakerId, change.createdDoc))
        .with({type:'updated'}, change => collectionRef.value.set(speakerId, change.updatedDoc))
        .with({type:'deleted'}, change => collectionRef.value.delete(speakerId))
        .exhaustive()
    }
  );

  return {
    speakers: computed(() => {
      const firestoreSpeakersLineup = toValue(firestoreSpeakersRef),
        eventDescriptor = toValue(eventDescriptorRef),
        searchTerms = toValue(searchTermsRef);

      if(!firestoreSpeakersLineup || !eventDescriptor) {
        return undefined;
      }

      const speakers = sortBy(
        [...firestoreSpeakersLineup.values()]
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

export function eventLineupSpeakersCollections(eventDescriptor: VoxxrinConferenceDescriptor|undefined) {
  if(!eventDescriptor || !eventDescriptor.id || !eventDescriptor.id.value) {
    return [];
  }

  return [
    collection(db,
    `${resolvedEventFirestorePath(eventDescriptor.id.value, eventDescriptor.spaceToken?.value)}/speakers`
    ) as CollectionReference<LineupSpeaker>
  ];
}

export function eventLineupSpeakerDocument(eventDescriptor: VoxxrinConferenceDescriptor|undefined, speakerId: SpeakerId|undefined) {
  if(!eventDescriptor || !eventDescriptor.id || !eventDescriptor.id.value || !speakerId || !speakerId.value) {
    return undefined;
  }

  return doc(db,
    `${resolvedEventFirestorePath(eventDescriptor.id.value, eventDescriptor.spaceToken?.value)}/speakers/${speakerId.value}`
    ) as DocumentReference<LineupSpeaker>;
}

export async function prepareEventSpeakers(user: User, conferenceDescriptor: VoxxrinConferenceDescriptor, promisesQueue: CompletablePromiseQueue) {
  promisesQueue.add(() => checkCache(`eventSpeakersPreparation(eventId=${conferenceDescriptor.id.value})`,
    Temporal.Duration.from({ hours: 24 }), // No need to have frequent refreshes for list of speakers...
    async () => {
      PERF_LOGGER.debug(`eventTalkPreparation(eventId=${conferenceDescriptor.id.value})`)

      const speakersColl = eventLineupSpeakersCollections(conferenceDescriptor)[0];
      const speakers = await getDocs(speakersColl)

      promisesQueue.addAll(speakers.docs.map(speaker => () => {
        const speakerData = speaker.data()
        if(speakerData.photoUrl) {
          return loadSpeakerUrl(speakerData.photoUrl);
        }
      }), {priority: 100 });
    }), { priority: 1000 });
}
