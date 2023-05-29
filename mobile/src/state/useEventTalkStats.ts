import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {computed, ref, Ref, unref, watch} from "vue";
import {Unreffable} from "@/views/vue-utils";
import {collection, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkStats} from "../../../shared/feedbacks.firestore";
import {useDocument} from "vuefire";
import {createVoxxrinTalkStatsFromFirestore} from "@/models/VoxxrinTalkStats";
import {createSharedComposable} from "@vueuse/core";


export function useTalkStats(eventIdRef: Unreffable<EventId | undefined>,
           talkIdRef: Unreffable<TalkId | undefined>) {

    const firestoreTalkStatsSource = computed(() => {
        const eventId = unref(eventIdRef),
            talkId = unref(talkIdRef);

        if(!eventId || !eventId.value || !talkId || !talkId.value) {
            return undefined;
        }

        return doc(collection(doc(collection(db,
            'events'), eventId.value),
            'talksStats'), talkId.value) as DocumentReference<TalkStats>
    });

    const firestoreTalkStatsRef = useDocument(firestoreTalkStatsSource);

    // This ref is used to store an increment/decrement of the total number of votes *in memory*
    //
    // This can be useful when there is some delay between user fav/unfav is propagated to total talk stats
    // in firestore, due to either offline usage, or deferred total count of the total talk stats
    //
    // Important note: this is only an "in-memory" count, meaning that if app is refreshed or restarted
    // this count will be lost until user gets back online and his fav/unfav is taken into consideration
    // into firestore
    const inMemoryDeltaUntilFirestoreRefreshRef = ref(0);
    watch([firestoreTalkStatsRef], ([firestoreTalkStats]) => {
        // Resetting local delta everytime we receive a firestore refresh
        inMemoryDeltaUntilFirestoreRefreshRef.value = 0;
    })

    return {
        eventTalkStats: computed(() => {
            const talkId = unref(talkIdRef);
            const firestoreTalkStats = unref(firestoreTalkStatsRef);
            const localDeltaUntilFirestoreRefresh = unref(inMemoryDeltaUntilFirestoreRefreshRef);

            if(talkId === undefined || talkId.value === undefined) {
                return undefined;
            }

            const firestoreTotalFavoritesCount = firestoreTalkStats?.totalFavoritesCount || 0;

            const voxxrinStats = createVoxxrinTalkStatsFromFirestore({
                id: talkId.value,
                totalFavoritesCount: firestoreTotalFavoritesCount
            });

            return {
                ...voxxrinStats,
                totalFavoritesCount: voxxrinStats.totalFavoritesCount + localDeltaUntilFirestoreRefresh
            }
        }),
        incrementInMemoryTotalFavoritesCount: () => {
            // Note: for whatever reason, localDeltaUntilFirestoreRefreshRef.value++ doesn't trigger ref update
            inMemoryDeltaUntilFirestoreRefreshRef.value = inMemoryDeltaUntilFirestoreRefreshRef.value+1;
        },
        decrementInMemoryTotalFavoritesCount: () => {
            // Note: for whatever reason, localDeltaUntilFirestoreRefreshRef.value-- doesn't trigger ref update
            inMemoryDeltaUntilFirestoreRefreshRef.value = inMemoryDeltaUntilFirestoreRefreshRef.value-1;
        }
    };
}

export function prepareTalkStats(
    eventId: EventId,
    dayAndTalkIds: Array<{dayId: DayId, talkId: TalkId}>
) {
    dayAndTalkIds.forEach(dayAndTalkId => {
        useTalkStats(eventId, dayAndTalkId.talkId);
    })
}

export const useSharedTalkStats = createSharedComposable(useTalkStats)
