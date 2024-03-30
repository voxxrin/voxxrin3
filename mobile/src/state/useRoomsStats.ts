import {computed, Ref, toValue, unref} from "vue";
import {EventId} from "@/models/VoxxrinEvent";
import {PERF_LOGGER} from "@/services/Logger";
import {deferredVuefireUseDocument} from "@/views/vue-utils";
import {collection, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {RoomsStats} from "../../../shared/event-stats";
import {unescapeFirebaseKey} from "../../../shared/utilities/firebase.utils";
import {createVoxxrinRoomStatsFromFirestore} from "@/models/VoxxrinRoomStats";



export function useRoomsStats(eventIdRef: Ref<EventId|undefined>) {
  PERF_LOGGER.debug(() => `useRoomsStats(eventId=${toValue(eventIdRef)?.value})`)

  const firestoreRoomsStatsRef = deferredVuefireUseDocument([eventIdRef],
    ([eventId]) => getEventRoomsStatsDoc(eventId));

  return {
    firestoreRoomsStatsRef: computed(() => {
      const firestoreRoomsStats = unref(firestoreRoomsStatsRef)

      if(!firestoreRoomsStats) {
        return undefined;
      }

      return Object.fromEntries(Object.entries(firestoreRoomsStats).map(([escapedRoomId, roomStats]) => {
        return [ unescapeFirebaseKey(escapedRoomId), createVoxxrinRoomStatsFromFirestore(roomStats) ]
      }))
    })
  }
}

function getEventRoomsStatsDoc(eventId: EventId|undefined) {
  if(!eventId || !eventId.value) {
    return undefined;
  }

  return doc(collection(doc(collection(db, 'events'), eventId.value), 'roomsStats-allInOne'), 'self') as DocumentReference<RoomsStats>;
}
