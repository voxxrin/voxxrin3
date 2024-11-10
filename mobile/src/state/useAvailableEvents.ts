import {EventFamily, firestoreListableEventToVoxxrinListableEvent,} from "@/models/VoxxrinEvent";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {sortBy, toCollectionReferenceArray} from "@/models/utils";
import {computed, unref} from "vue";
import {collection, CollectionReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {useOverridenListableEventProperties} from "@/state/useDevUtilities";
import {deferredVuefireUseCollection} from "@/views/vue-utils";
import {match} from "ts-pattern";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {resolvedEventsFirestorePath} from "../../../shared/utilities/event-utils";

const LOGGER = Logger.named("useAvailableEvents");

export function useAvailableEvents(eventFamilies: EventFamily[]) {

    const overridenListableEventPropertiesRef = useOverridenListableEventProperties();
    const userTokensWalletRef = useUserTokensWallet().userTokensWalletRef

    PERF_LOGGER.debug(() => `useAvailableEvents()`)

    const firestoreListableEventsRef = deferredVuefireUseCollection([],
        () => toCollectionReferenceArray(collection(db, 'events') as CollectionReference<ListableEvent>),
        firestoreEvent => firestoreEvent,
        () => {},
        (change, docId, collectionRef) => {
            match(change)
                .with({type:'created'}, change => collectionRef.value.set(docId, change.createdDoc))
                .with({type:'updated'}, change => collectionRef.value.set(docId, change.updatedDoc))
                .with({type:'deleted'}, change => collectionRef.value.delete(docId))
                .exhaustive()
        }
    );

    const firestorePrivateSpaceTokensRef = computed(() => {
      const userTokensWallet = unref(userTokensWalletRef)
      if(!userTokensWallet) {
        return [];
      }

      const spaceTokens = userTokensWallet.secretTokens.privateSpaceTokens.flatMap(pst => pst.spaceTokens)
      return spaceTokens;
    })
    const firestorePrivateListableEventsRef = deferredVuefireUseCollection([ firestorePrivateSpaceTokensRef ],
        ([firestorePrivateSpaceTokens]) => (firestorePrivateSpaceTokens || []).map(spaceId => collection(db, resolvedEventsFirestorePath(spaceId.value)) as CollectionReference<ListableEvent>),
        firestoreEvent => firestoreEvent,
        () => {},
        (change, docId, collectionRef) => {
            match(change)
                .with({type:'created'}, change => collectionRef.value.set(docId, change.createdDoc))
                .with({type:'updated'}, change => collectionRef.value.set(docId, change.updatedDoc))
                .with({type:'deleted'}, change => collectionRef.value.delete(docId))
                .exhaustive()
        }
    );

    return {
        listableEvents: computed(() => {
            const firestoreListableEvents = unref(firestoreListableEventsRef),
                firestorePrivateListableEvents = unref(firestorePrivateListableEventsRef),
                overridenListableEventProperties = unref(overridenListableEventPropertiesRef);

            const validListableEventPredicate = (le: ListableEvent) => {
              return eventFamilies.length===0
                || (le.eventFamily!==undefined && eventFamilies.map(ef => ef.value).includes(le.eventFamily))
            }

            const filteredVoxxrinListableEvents =
              ([] as ListableEvent[])
                .concat(Array.from(firestoreListableEvents.values()))
                .concat(Array.from(firestorePrivateListableEvents.values()))
                .filter(validListableEventPredicate)
                .map(firestoreListableEventToVoxxrinListableEvent)

            const availableSortedEvents = sortBy(filteredVoxxrinListableEvents,event => -event.start.epochMilliseconds);

            return availableSortedEvents.map(event => {
                if(overridenListableEventProperties?.eventId === event.id.value) {
                    const {eventId, ...extractedProps} = overridenListableEventProperties;
                    return {...event, ...extractedProps}
                } else {
                    return event;
                }
            });
        })
    };
}
