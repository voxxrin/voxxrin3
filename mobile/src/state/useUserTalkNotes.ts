import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {computed, ref, Ref, toValue, unref, watch} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    deferredVuefireUseCollection,
    deferredVuefireUseDocument, MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES,
} from "@/views/vue-utils";
import {
    collection,
    doc,
    DocumentReference,
    setDoc,
    updateDoc,
    UpdateData, getDoc, query, CollectionReference, where
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkNote, UserComputedEventInfos, UserTalkNote} from "../../../shared/feedbacks.firestore";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import { User } from 'firebase/auth';
import {Temporal} from "temporal-polyfill";
import {checkCache} from "@/services/Cachings";
import {partitionArray, toValueObjectValues} from "@/models/utils";

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

export function useUserTalkNoteActions(
    eventIdRef: Ref<EventId | undefined>,
    talkIdRef: Ref<TalkId | undefined>
) {

    PERF_LOGGER.debug(() => `useUserTalkNoteActions(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})`)

    const userRef = useCurrentUser()

    const updateTalkNotesDocument = async (
        callContextName: string,
        talkNoteUpdater: (talkNote: TalkNote) => Partial<TalkNote>,
        afterUpdate: (updatedTalkNote: TalkNote) => Promise<void>|void = () => {}
    ) => {
        const eventId = toValue(eventIdRef),
            talkId = toValue(talkIdRef),
            user = toValue(userRef),
            firestoreUserTalkNotesDoc = getTalkNotesRef(user, eventId, talkId);

        if(!user || !talkId) {
            LOGGER.warn(() => `${callContextName}() called with an undefined user/talkId`)
            return;
        }

        if(!firestoreUserTalkNotesDoc) {
            LOGGER.warn(() => `${callContextName}() called with an undefined firestoreUserTalkNotes/firestoreUserTalkNotesDoc (is eventId/dayId/user defined ?)`)
            return;
        }

        const firestoreUserTalkNote = (await getDoc(firestoreUserTalkNotesDoc)).data();

        const initialNote: TalkNote = firestoreUserTalkNote?.note || {
            talkId: talkId.value,
            isFavorite: false,
            watchLater: null
        }

        const fieldsToUpdate = talkNoteUpdater(initialNote);
        const updatedTalkNotes = {
            ...initialNote,
            ...fieldsToUpdate
        }
        if(!firestoreUserTalkNote) {
            await setDoc(firestoreUserTalkNotesDoc, {
                userId: user.uid,
                note: updatedTalkNotes
            });
        } else {
            const translatedUpdatedData = Object.entries(fieldsToUpdate).reduce((updated, [key, value]) => {
                updated[`note.${key}`] = value;
                return updated;
            }, {} as UpdateData<any>)
            await updateDoc(firestoreUserTalkNotesDoc, translatedUpdatedData);
        }

        await afterUpdate(updatedTalkNotes);
    }

    const toggleFavorite = async () => {
        await updateTalkNotesDocument(
            'toggleFavorite',
            talkNotes => ({ isFavorite: !talkNotes.isFavorite }),
            updatedTalkNotes => {
                // TODO: Put this back maybe at some time ?
                // if(updatedTalkNotes.isFavorite) {
                //     incrementInMemoryTotalFavoritesCount();
                // } else {
                //     decrementInMemoryTotalFavoritesCount();
                // }
            });
    }
    const toggleWatchLater = async () => {
        await updateTalkNotesDocument(
            'toggleWatchLater',
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
        'talksNotes'), where("id", 'in', partitionnedTalkIds.map(id => id.value))
        ) as CollectionReference<UserTalkNote>
    );
}

export function useUserEventTalkNotes(eventIdRef: Ref<EventId|undefined>, talkIdsRef: Ref<TalkId[]|undefined>) {
    PERF_LOGGER.debug(() => `useUserEventTalkNotes(eventId=${toValue(eventIdRef)?.value}, talkIds=${toValueObjectValues(toValue(talkIdsRef))})`)
    const userRef = useCurrentUser()

    const {allUserFavoritedTalkIds: allUserFavoritedTalkIdsRef} = useUserEventAllFavoritedTalkIds(eventIdRef)

    const userEventTalkNotesRef = deferredVuefireUseCollection(
        [eventIdRef, userRef, talkIdsRef],
        ([eventId, user, talkIds]) => getUserEventTalkNotesSources(user, eventId, talkIds),
        firestoreUserTalkNote => firestoreUserTalkNote.note, // TODO: transform to Voxxrin ???
        (firestoreUserTalkNotesByTalkIdRef, eventId, user, talkIds) => {
            const allUserFavoritedTalkIds = toValueObjectValues(toValue(allUserFavoritedTalkIdsRef)) || [];
            // Filling map with an "empty" note by default, so that we have one note for every talk
            // Map will then be filled with proper fetched note snapshots
            talkIds.forEach(talkId => {
                if(!firestoreUserTalkNotesByTalkIdRef.value.has(talkId.value)) {
                    firestoreUserTalkNotesByTalkIdRef.value.set(talkId.value, {
                        talkId: talkId?.value || '???',
                        isFavorite: allUserFavoritedTalkIds.includes(talkId.value),
                        watchLater: null,
                    });
                }
            })
        }
    );

    watch([allUserFavoritedTalkIdsRef], ([allUserFavoritedTalkIds]) => {
        const userEventTalkNotes = toValue(userEventTalkNotesRef);
        Array.from(userEventTalkNotes.keys()).forEach(talkId => {
            const isFavorited = (toValueObjectValues(allUserFavoritedTalkIds) || []).includes(talkId);
            if(userEventTalkNotes.get(talkId)!.isFavorite !== isFavorited) {
                userEventTalkNotes.set(talkId, {
                    ...userEventTalkNotes.get(talkId)!,
                    isFavorite: isFavorited
                })
            }
        })
    })

    return {
        userEventTalkNotesRef
    }
}

function getAllFavoritedUserTalkIdsRefs(user: User|null|undefined, eventId: EventId|undefined) {
    if(!user || !eventId ||!eventId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(doc(collection(db,
                'users'), user.uid),
            'events'), eventId.value),
        '__computed'), "self"
    ) as DocumentReference<UserComputedEventInfos>;
}

export function useUserEventAllFavoritedTalkIds(eventIdRef: Ref<EventId | undefined>) {

    PERF_LOGGER.debug(() => `useUserEventAllFavoritedTalkIds(${unref(eventIdRef)?.value})`)
    const userRef = useCurrentUser()

    const firestoreUserAllFavoritedTalkIdsRef = deferredVuefireUseDocument([eventIdRef, userRef],
        ([eventId, user]) => getAllFavoritedUserTalkIdsRefs(user, eventId));

    const allUserFavoritedTalkIdsRef: Ref<TalkId[]> = computed(() => {
        const firestoreUserAllFavoritedTalkIds = unref(firestoreUserAllFavoritedTalkIdsRef);

        if(!firestoreUserAllFavoritedTalkIds) {
            return [];
        }

        return firestoreUserAllFavoritedTalkIds.favoritedTalkIds.map(id => new TalkId(id));
    })

    return {
        allUserFavoritedTalkIds: allUserFavoritedTalkIdsRef
    };
}

export async function prepareUserTalkNotes(
    user: User,
    eventId: EventId,
    dayId: DayId,
    talkIds: Array<TalkId>
) {
    return checkCache(`prepareUserTalkNotes(eventId=${eventId.value}, dayId=${dayId.value})`, Temporal.Duration.from({ hours: 24 }), async () => {
        PERF_LOGGER.debug(`prepareUserTalkNotes(user=${user.uid}, eventId=${eventId.value}, talkIds=${JSON.stringify(talkIds.map(talkId => talkId.value))})`)
        await Promise.all(talkIds.map(async (talkId) => {
            const talkNotesRef = getTalkNotesRef(user, eventId, talkId);
            if(talkNotesRef) {
                await getDoc(talkNotesRef)
                PERF_LOGGER.debug(`getDoc(${talkNotesRef.path})`)
            }
        }))
    })
}
