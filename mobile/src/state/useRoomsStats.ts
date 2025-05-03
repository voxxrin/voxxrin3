import {computed, Ref, toValue, unref} from "vue";
import {SpacedEventId, stringifySpacedEventId} from "@/models/VoxxrinEvent";
import {PERF_LOGGER} from "@/services/Logger";
import {deferredVuefireUseDocument} from "@/views/vue-utils";
import {doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {RoomsStats} from "@shared/event-stats";
import {toValidFirebaseKey, unescapeFirebaseKey} from "@shared/utilities/firebase.utils";
import {createVoxxrinRoomStatsFromFirestore} from "@/models/VoxxrinRoomStats";
import {RoomId} from "@/models/VoxxrinRoom";
import {resolvedEventFirestorePath} from "@shared/utilities/event-utils";

export function useRoomsStats(spacedEventIdRef: Ref<SpacedEventId|undefined>) {
  PERF_LOGGER.debug(() => `useRoomsStats(spacedEventId=${stringifySpacedEventId(toValue(spacedEventIdRef))})`)

  const firestoreRoomsStatsRef = deferredVuefireUseDocument([spacedEventIdRef],
    ([spacedEventId]) => getEventRoomsStatsDoc(spacedEventId));

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

export function useRoomStats(spacedEventIdRef: Ref<SpacedEventId|undefined>, roomIdRef: Ref<RoomId|undefined>) {
  PERF_LOGGER.debug(() => `useRoomStats(eventId=${stringifySpacedEventId(toValue(spacedEventIdRef))}. roomId=${toValue(roomIdRef)?.value})`)

  const firestoreRoomsStatsRef = deferredVuefireUseDocument([spacedEventIdRef],
    ([spacedEventId]) => getEventRoomsStatsDoc(spacedEventId));

  return {
    firestoreRoomStatsRef: computed(() => {
      const firestoreRoomsStats = unref(firestoreRoomsStatsRef)
      const roomId = unref(roomIdRef)

      if(!firestoreRoomsStats || !roomId) {
        return undefined;
      }

      const firestoreRoomStats = firestoreRoomsStats[toValidFirebaseKey(roomId.value)]
      if(!firestoreRoomStats) {
        return undefined;
      }

      return createVoxxrinRoomStatsFromFirestore(firestoreRoomStats);
    })
  }
}

function getEventRoomsStatsDoc(spacedEventId: SpacedEventId|undefined) {
  if(!spacedEventId || !spacedEventId.eventId || !spacedEventId.eventId.value) {
    return undefined;
  }

  return doc(
    db,
    `${resolvedEventFirestorePath(spacedEventId.eventId.value, spacedEventId.spaceToken?.value)}/roomsStats-allInOne/self`
  ) as DocumentReference<RoomsStats>;
}
