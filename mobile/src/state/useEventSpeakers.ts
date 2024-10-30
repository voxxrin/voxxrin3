import {computed, Ref, toValue} from "vue";
import {deferredVuefireUseCollection, deferredVuefireUseDocument} from "@/views/vue-utils";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {collection, CollectionReference, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {resolvedEventFirestorePath} from "../../../shared/utilities/event-utils";
import {LineupSpeaker} from "../../../shared/event-lineup.firestore";
import {createVoxxrinSpeakerFromFirestore} from "@/models/VoxxrinSpeaker";
import {match} from "ts-pattern";
import {sortBy} from "@/models/utils";

export function useLineupSpeakers(eventDescriptorRef: Ref<VoxxrinConferenceDescriptor|undefined>) {

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
        eventDescriptor = toValue(eventDescriptorRef);

      if(!firestoreSpeakersLineup || !eventDescriptor) {
        return undefined;
      }

      const speakers = sortBy(
        [...firestoreSpeakersLineup.values()].map(fSpeaker => createVoxxrinSpeakerFromFirestore(eventDescriptor, fSpeaker)),
        sp => sp.fullName
      );
      return speakers;
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
