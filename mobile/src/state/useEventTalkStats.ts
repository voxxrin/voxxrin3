import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {computed, Ref, toValue, unref, watch, watchEffect} from "vue";
import {
    deferredVuefireUseCollection,
    deferredVuefireUseDocument,
    managedRef as ref, MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES,
} from "@/views/vue-utils";
import {
    collection,
    CollectionReference,
    doc,
    DocumentReference,
    getDoc,
    query,
    where,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {createVoxxrinTalkStatsFromFirestore} from "@/models/VoxxrinTalkStats";
import {PERF_LOGGER} from "@/services/Logger";
import {checkCache} from "@/services/Cachings";
import {Temporal} from "temporal-polyfill";
import {partitionArray, toValueObjectValues} from "@/models/utils";
import {match} from "ts-pattern";
import {TalkStats} from "../../../shared/event-stats";

function getTalksStatsRef(eventId: EventId|undefined, talkId: TalkId|undefined) {
    if(!eventId || !eventId.value || !talkId || !talkId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(db,
            'events'), eventId.value),
        'talksStats'), talkId.value) as DocumentReference<TalkStats>;
}

/**
 * @deprecated use useAllEventTalkStats() instead
 * Keeping it only because of inMemoryDeltaUntilFirestoreRefreshRef (in case we would reuse it someday)
 * @param eventIdRef
 * @param talkIdRef
 */
export function useTalkStats(eventIdRef: Ref<EventId | undefined>,
           talkIdRef: Ref<TalkId | undefined>) {

    PERF_LOGGER.debug(() => `useTalkStats(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})`)

    const firestoreTalkStatsRef = deferredVuefireUseDocument([eventIdRef, talkIdRef],
        ([eventId, talkId]) => getTalksStatsRef(eventId, talkId),
    );

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

function getEventTalkStatsSources(eventId: EventId|undefined, talkIds: TalkId[]|undefined) {
    if(!eventId || !eventId.value || !talkIds || !talkIds.filter(id => id && id.value).length) {
        return undefined;
    }

    return partitionArray(talkIds, MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES).map(partitionnedTalkIds =>
        query(collection(doc(collection(db,
                'events'), eventId.value),
            'talksStats'), where("id", 'in', toValueObjectValues(partitionnedTalkIds))
        ) as CollectionReference<TalkStats>
    );
}

export function useEventTalkStats(eventIdRef: Ref<EventId|undefined>, talkIdsRef: Ref<TalkId[]|undefined>) {
    PERF_LOGGER.debug(() => `useEventTalkStats(eventId=${toValue(eventIdRef)?.value}, talkIds=${toValueObjectValues(toValue(talkIdsRef))})`)

    const firestoreEventTalkStatsRef = deferredVuefireUseCollection([eventIdRef, talkIdsRef],
        ([eventId, talkIds]) => getEventTalkStatsSources(eventId, talkIds),
        firestoreData => firestoreData,
        (eventTalkStatsRef, eventId, talkIds) => {
            eventTalkStatsRef.value.clear();
            // Filling map with "empty" stats by default, so that we have one stat for every talk
            // Map will then be filled with proper fetched stats snapshots afterwards
            talkIds.forEach(talkId => {
                if(!eventTalkStatsRef.value.has(talkId.value)) {
                    eventTalkStatsRef.value.set(talkId.value, {
                        id: talkId.value,
                        totalFavoritesCount: 0
                    });
                }
            })
        },
        (change, docId, collectionRef) => {
            match(change)
                .with({type:'created'}, change => collectionRef.value.set(docId, change.createdDoc))
                .with({type:'updated'}, change => collectionRef.value.set(docId, change.updatedDoc))
                .with({type:'deleted'}, change => collectionRef.value.delete(docId))
                .exhaustive()
        }

    );

    return {
        firestoreEventTalkStatsRef
    }
}


export async function prepareTalkStats(
    eventId: EventId,
    dayId: DayId,
    talkIds: Array<TalkId>
) {
    return checkCache(`talkStatsPreparation(eventId=${eventId.value}, dayId=${dayId.value})`, Temporal.Duration.from({ hours: 2 }), async () => {
        PERF_LOGGER.debug(`prepareTalkStats(eventId=${eventId.value}, talkIds=${JSON.stringify(talkIds.map(talkId => talkId.value))})`)
        await Promise.all(talkIds.map(async talkId => {
            const talksStatsRef = getTalksStatsRef(eventId, talkId);
            if(talksStatsRef) {
                await getDoc(talksStatsRef)
                PERF_LOGGER.debug(`getDoc(${talksStatsRef.path})`)
            }
        }))
    });
}

