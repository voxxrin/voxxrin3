import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {Ref, toValue, unref} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    deferredVuefireUseCollection,
    MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES,
} from "@/views/vue-utils";
import {
    collection,
    doc,
    DocumentReference,
    runTransaction, Transaction,
    UpdateData, getDoc, query, CollectionReference, where
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkNote, UserComputedEventInfos, UserTalkNote} from "../../../shared/feedbacks.firestore";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import { User } from 'firebase/auth';
import {Temporal} from "temporal-polyfill";
import {checkCache} from "@/services/Cachings";
import {CompletablePromiseQueue, partitionArray, toValueObjectValues} from "@/models/utils";
import {match, P} from "ts-pattern";
import {ISODatetime} from "../../../shared/type-utils";

const LOGGER = Logger.named("useUserTalkNotes");

function getTalkNotesRef(user: User|undefined|null, eventId: EventId|undefined, talkId: TalkId|undefined): DocumentReference<UserTalkNote>|undefined {
    if(!eventId || !eventId.value || !user || !talkId || !talkId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(doc(collection(db,
                'users'), user.uid),
            'events'), eventId.value),
        'talksNotes'), talkId.value
    ) as DocumentReference<UserTalkNote>
}

type LocalTalkNoteUpdate = {
    date: ISODatetime,
    update: 'mark-favorited' | 'unmark-favorited' | 'mark-watch-later' | 'unmark-watch-later',
    updatedTalkNote: TalkNote
}

// For every talk note id, we have a FIFO queue of modifications
// As soon as we have modifications into the stack, we should keep them, otherwise we will
// undtack modification everytime we receive an update from the server
//
// IMPORTANT NOTE: these local modifications are store outside useUserTalkNotes() hooks
// in order to be shared across multiple pages transparently
// (this is typically useful to share it between talk details and schedule pages)
const perEventIdLocalTalkNotesUpdates = new Map<string, Map<string, LocalTalkNoteUpdate[]>>()
function ensureLocalTalkNoteUpdatesCreatedfor(eventId: EventId, talkId: TalkId) {
    if(!perEventIdLocalTalkNotesUpdates.has(eventId.value)) {
        perEventIdLocalTalkNotesUpdates.set(eventId.value, new Map());
    }

    let perTalkIdNoteUpdates = perEventIdLocalTalkNotesUpdates.get(eventId.value)!;
    if(!perTalkIdNoteUpdates.has(talkId.value)) {
        perTalkIdNoteUpdates.set(talkId.value, []);
    }

    return perTalkIdNoteUpdates;
}
function getLocalTalkNoteUpdates(eventId: EventId, talkId: TalkId): LocalTalkNoteUpdate[] {
    const perTalkIdNoteUpdates = ensureLocalTalkNoteUpdatesCreatedfor(eventId, talkId);
    return perTalkIdNoteUpdates.get(talkId.value)!;
}
function getLastLocalTalkNotesUpdatesOf(localTalkNoteUpdates: LocalTalkNoteUpdate[]): LocalTalkNoteUpdate|undefined {
    return localTalkNoteUpdates.length ? localTalkNoteUpdates[localTalkNoteUpdates.length-1] : undefined;
}
function getLastLocalTalkNotesUpdates(eventId: EventId, talkId: TalkId): LocalTalkNoteUpdate|undefined {
    const localTalkNotesUpdates = getLocalTalkNoteUpdates(eventId, talkId);
    return getLastLocalTalkNotesUpdatesOf(localTalkNotesUpdates);
}


export function useUserTalkNoteActions(
    eventIdRef: Ref<EventId | undefined>,
    talkIdRef: Ref<TalkId | undefined>,
    maybeNoteRef: Ref<TalkNote|undefined> | undefined,
    onTalkNoteUpdated: (updatedTalkNote: TalkNote) => void = () => {}
) {

    PERF_LOGGER.debug(() => `useUserTalkNoteActions(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})`)

    const userRef = useCurrentUser()

    const updateTalkNotesDocument = async (
        callContextName: string,
        localUpdateType: (talkNoteBeforeUpdate: TalkNote) => LocalTalkNoteUpdate['update'],
        talkNoteUpdater: (talkNote: TalkNote) => Partial<TalkNote>,
        afterUpdate: (updatedTalkNote: TalkNote, transaction: Transaction) => Promise<void>|void = () => {}
    ) => {
        const eventId = toValue(eventIdRef),
            talkId = toValue(talkIdRef),
            user = toValue(userRef),
            firestoreUserTalkNotesDoc = getTalkNotesRef(user, eventId, talkId);

        if(!eventId || !user || !talkId) {
            LOGGER.warn(() => `${callContextName}() called with an undefined eventId/user/talkId`)
            return;
        }

        if(!firestoreUserTalkNotesDoc) {
            LOGGER.warn(() => `${callContextName}() called with an undefined firestoreUserTalkNotes/firestoreUserTalkNotesDoc (is eventId/dayId/user defined ?)`)
            return;
        }

        await runTransaction(db, async (transaction) => {
            const fetchingServerTalkNotePromise = transaction.get(firestoreUserTalkNotesDoc)

            const localTalkNotesUpdates = getLocalTalkNoteUpdates(eventId, talkId);
            const lastLocalTalkNotesUpdates = getLastLocalTalkNotesUpdatesOf(localTalkNotesUpdates);

            const talkNoteMaster: {source: 'local'|'contextual'|'server'|'fallback', talkNote: TalkNote } = await match([
                maybeNoteRef && maybeNoteRef.value, lastLocalTalkNotesUpdates
            ] as const).with([P.not(P.nullish), P._], async ([contextualTalkNote, _]) => ({
                    source: 'contextual' as const, talkNote: contextualTalkNote
                })).with([P._, P.not(P.nullish)], async ([_, localTalkNote]) => ({
                    source: 'local' as const, talkNote: localTalkNote.updatedTalkNote
                })).otherwise(async () => {
                    const serverTalkNote = (await fetchingServerTalkNotePromise).data()?.note;
                    if(serverTalkNote) {
                        return { source: 'server' as const, talkNote: serverTalkNote };
                    }

                    const fallbackTalkNote: TalkNote = {
                        talkId: talkId.value,
                        isFavorite: false,
                        watchLater: null
                    }

                    return { source: 'fallback' as const, talkNote: fallbackTalkNote }
                })

            const localTalkNoteUpdateType = localUpdateType(talkNoteMaster.talkNote)
            const fieldsToUpdate = talkNoteUpdater(talkNoteMaster.talkNote);
            const updatedTalkNotes = {
                ...talkNoteMaster.talkNote,
                ...fieldsToUpdate
            }

            const localTalkNoteUpdate: LocalTalkNoteUpdate = {
                date: new Date().toISOString() as ISODatetime,
                update: localTalkNoteUpdateType,
                updatedTalkNote: updatedTalkNotes
            }
            localTalkNotesUpdates.push(localTalkNoteUpdate)

            // Updating quickly (without blocking through an await if this is possible) the note reference
            // so that we can give a quick feedback to user
            onTalkNoteUpdated(updatedTalkNotes);

            const serverTalkNote = (await fetchingServerTalkNotePromise).data()?.note;

            if(!serverTalkNote) {
                transaction.set(firestoreUserTalkNotesDoc, {
                    userId: user.uid,
                    note: updatedTalkNotes
                })
            } else {
                const translatedUpdatedData = Object.entries(fieldsToUpdate).reduce((updated, [key, value]) => {
                    updated[`note.${key}`] = value;
                    return updated;
                }, {} as UpdateData<any>)

                transaction.update(firestoreUserTalkNotesDoc, translatedUpdatedData)
            }

            await afterUpdate(updatedTalkNotes, transaction);
        })
    }

    const toggleFavorite = async () => {
        await updateTalkNotesDocument(
            'toggleFavorite',
            talkNoteBeforeUpdate => talkNoteBeforeUpdate.isFavorite ? 'unmark-favorited' : 'mark-favorited',
            talkNotes => ({ isFavorite: !talkNotes.isFavorite }),
            // updatedTalkNotes => {
                // TODO: Put this back maybe at some time ?
                // if(updatedTalkNotes.isFavorite) {
                //     incrementInMemoryTotalFavoritesCount();
                // } else {
                //     decrementInMemoryTotalFavoritesCount();
                // }
            // }
            );
    }
    const toggleWatchLater = async () => {
        await updateTalkNotesDocument(
            'toggleWatchLater',
            talkNoteBeforeUpdate => talkNoteBeforeUpdate.watchLater ? 'unmark-watch-later' : 'mark-watch-later',
            talkNotes => ({ watchLater: !talkNotes.watchLater }),
        );
    }

    return {
        toggleFavorite,
        toggleWatchLater
    }
}

function getUserEventTalkNotesSources(user: User|null|undefined, eventId: EventId|undefined, talkIds: TalkId[]|undefined) {
    if(!user || !eventId || !eventId.value || !talkIds || !talkIds.length) {
        return undefined;
    }

    return partitionArray(talkIds, MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES).map(partitionnedTalkIds =>
        query(collection(doc(collection(doc(collection(db,
                'users'), user.uid),
            'events'), eventId.value),
        'talksNotes'), where("note.talkId", 'in', partitionnedTalkIds.map(id => id.value))
        ) as CollectionReference<UserTalkNote>
    );
}

export function useUserEventTalkNotes(eventIdRef: Ref<EventId|undefined>, talkIdsRef: Ref<TalkId[]|undefined>) {
    PERF_LOGGER.debug(() => `useUserEventTalkNotes(eventId=${toValue(eventIdRef)?.value}, talkIds=${toValueObjectValues(toValue(talkIdsRef))})`)
    const userRef = useCurrentUser()

    const userEventTalkNotesRef = deferredVuefireUseCollection(
        [eventIdRef, userRef, talkIdsRef],
        ([eventId, user, talkIds]) => getUserEventTalkNotesSources(user, eventId, talkIds),
        firestoreUserTalkNote => firestoreUserTalkNote.note, // TODO: transform to Voxxrin ???
        (firestoreUserTalkNotesByTalkIdRef, eventId, user, talkIds) => {
            // When talk ids are changing (on a day switch), this callback will be triggered

            // Filling map with an "empty" note by default, so that we have one note for every talk
            // Map will then be filled with proper fetched note snapshots
            talkIds.forEach(talkId => {
                ensureLocalTalkNoteUpdatesCreatedfor(eventId, talkId);

                const localTalkNotesUpdates = getLastLocalTalkNotesUpdates(eventId, talkId);
                if(localTalkNotesUpdates) {
                    firestoreUserTalkNotesByTalkIdRef.value.set(talkId.value, localTalkNotesUpdates.updatedTalkNote);
                } else if(!firestoreUserTalkNotesByTalkIdRef.value.has(talkId.value)) {
                    firestoreUserTalkNotesByTalkIdRef.value.set(talkId.value, {
                        talkId: talkId?.value || '???',
                        isFavorite: false,
                        watchLater: null,
                    });
                }
            })
        },
        (change, talkId, collectionRef) => {
            match(change)
                .with({type:'created'}, change => { collectionRef.value.set(talkId, change.createdDoc) })
                .with({type:'updated'}, change => {
                    const eventId = toValue(eventIdRef)!;
                    const localTalkNotesUpdates = getLocalTalkNoteUpdates(eventId, new TalkId(talkId));

                    // Systematically removing oldest element from the stack
                    // This part is a VERY IMPORTANT RULE as this allow to have local modifications
                    // to take precedence over server-pushed modifications... until we receive
                    // the same amount of server-pushed modifications than our local modification
                    // This typically allows user to toggle favorites MULTIPLE TIMES without having
                    // server-pushed event to toggle favorites
                    // AND in the same time, allow server PUSH to be reflected in the UI
                    // when there is no longer local modifications (can be useful for favorites updates coming from multiple tabs/devices for the same user id)
                    if(localTalkNotesUpdates) {
                        const oldestState = localTalkNotesUpdates.shift();
                    }

                    const latestLocalKnownState = getLastLocalTalkNotesUpdatesOf(localTalkNotesUpdates);

                    collectionRef.value.set(talkId, latestLocalKnownState?.updatedTalkNote || change.updatedDoc)
                }).with({type:'deleted'}, change => { collectionRef.value.delete(talkId) })
                .exhaustive()
        },
    );

    return {
        userEventTalkNotesRef,
    }
}

export async function prepareUserTalkNotes(
    user: User,
    eventId: EventId,
    dayId: DayId,
    talks: Array<VoxxrinTalk>,
    promisesQueue: CompletablePromiseQueue
) {
    return checkCache(`prepareUserTalkNotes(eventId=${eventId.value}, dayId=${dayId.value})`, Temporal.Duration.from({ hours: 24 }), async () => {
        PERF_LOGGER.debug(`prepareUserTalkNotes(user=${user.uid}, eventId=${eventId.value}, talkIds=${JSON.stringify(talks.map(talk => talk.id.value))})`)
        promisesQueue.addAll(talks.map(talk => {
          return async () => {
            const talkNotesRef = getTalkNotesRef(user, eventId, talk.id);
            if(talkNotesRef) {
              await getDoc(talkNotesRef)
              PERF_LOGGER.debug(`getDoc(${talkNotesRef.path})`)
            }
          }
        }), { priority: 10 })
    })
}
