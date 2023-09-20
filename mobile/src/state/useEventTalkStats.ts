import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {computed, unref, watch} from "vue";
import {managedRef as ref, Unreffable} from "@/views/vue-utils";
import {collection, doc, DocumentReference, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkStats} from "../../../shared/feedbacks.firestore";
import {useDocument} from "vuefire";
import {createVoxxrinTalkStatsFromFirestore} from "@/models/VoxxrinTalkStats";
import {PERF_LOGGER} from "@/services/Logger";

function getTalksStatsRef(eventId: EventId, talkId: TalkId) {
    return doc(collection(doc(collection(db,
            'events'), eventId.value),
        'talksStats'), talkId.value) as DocumentReference<TalkStats>;
}

export function useTalkStats(eventIdRef: Unreffable<EventId | undefined>,
           talkIdRef: Unreffable<TalkId | undefined>) {

    PERF_LOGGER.debug(() => `useTalkStats(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})`)
    const firestoreTalkStatsSource = computed(() => {
        const eventId = unref(eventIdRef),
            talkId = unref(talkIdRef);

        if(!eventId || !eventId.value || !talkId || !talkId.value) {
            return undefined;
        }

        return getTalksStatsRef(eventId, talkId);
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
    watch(firestoreTalkStatsRef, (newVal, oldVal) => {
        if(newVal !== oldVal && newVal?.id !== oldVal?.id) {
            PERF_LOGGER.debug(() => `useTalkStats(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})[firestoreTalkStatsRef] updated from [${oldVal?.id}] to [${newVal?.id}]`)
        }

        // Resetting local delta everytime we receive a firestore refresh
        inMemoryDeltaUntilFirestoreRefreshRef.value = 0;
    }, {immediate: true})

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

export async function prepareTalkStats(
    eventId: EventId,
    talkIds: Array<TalkId>
) {
    PERF_LOGGER.debug(`prepareTalkStats(eventId=${eventId.value}, talkIds=${JSON.stringify(talkIds.map(talkId => talkId.value))})`)
    await Promise.all(talkIds.map(async talkId => {
        const talksStatsRef = getTalksStatsRef(eventId, talkId);
        await getDoc(talksStatsRef)
        PERF_LOGGER.debug(`getDoc(${talksStatsRef.path})`)
    }))
}

