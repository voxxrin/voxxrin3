import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {computed, ref, Ref, toValue, unref, watch} from "vue";
import {useTalkStats} from "@/state/useEventTalkStats";
import {useCurrentUser} from "@/state/useCurrentUser";
import {deferredVuefireUseDocument, managedUseDocument} from "@/views/vue-utils";
import {
    collection,
    doc,
    DocumentReference,
    setDoc,
    updateDoc,
    UpdateData, getDoc
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkNote, UserComputedEventInfos, UserTalkNote} from "../../../shared/feedbacks.firestore";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import { User } from 'firebase/auth';
import {Temporal} from "temporal-polyfill";
import {checkCache} from "@/services/Cachings";

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

export function useUserTalkNotes(
    eventIdRef: Ref<EventId | undefined>,
    talkIdRef: Ref<TalkId | undefined>) {

    PERF_LOGGER.debug(() => `useUserTalkNotes(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})`)

    const userRef = useCurrentUser()

    const { eventTalkStats, incrementInMemoryTotalFavoritesCount, decrementInMemoryTotalFavoritesCount } = useTalkStats(eventIdRef, talkIdRef)

    const firestoreUserTalkNotesRef = deferredVuefireUseDocument([eventIdRef, userRef, talkIdRef],
        ([eventId, user, talkId]) => getTalkNotesRef(user, eventId, talkId));

    const talkNoteRef: Ref<TalkNote> = computed(() => {
        const firestoreUserTalkNotes = unref(firestoreUserTalkNotesRef),
            talkId = unref(talkIdRef),
            user = unref(userRef);

        if(firestoreUserTalkNotes) {
            return firestoreUserTalkNotes.note;
        }

        return {
            talkId: talkId?.value || '???',
            isFavorite: false,
            watchLater: null,
            ratings: {
                bingo: null,
                scale: null
            },
            comment: null
        };
    })

    const updateTalkNotesDocument = async (
        callContextName: string,
        talkNoteUpdater: (talkNote: TalkNote) => Partial<TalkNote>,
        afterUpdate: (updatedTalkNote: TalkNote) => Promise<void>|void = () => {}
    ) => {
        const eventId = toValue(eventIdRef),
            firestoreUserTalkNotes = toValue(firestoreUserTalkNotesRef),
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

        const initialNote: TalkNote = firestoreUserTalkNotes?.note || {
            talkId: talkId.value,
            isFavorite: false,
            watchLater: null
        }

        const fieldsToUpdate = talkNoteUpdater(initialNote);
        const updatedTalkNotes = {
            ...initialNote,
            ...fieldsToUpdate
        }
        if(!firestoreUserTalkNotes) {
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
                if(updatedTalkNotes.isFavorite) {
                    incrementInMemoryTotalFavoritesCount();
                } else {
                    decrementInMemoryTotalFavoritesCount();
                }
            });
    }
    const toggleWatchLater = async () => {
        await updateTalkNotesDocument(
            'toggleWatchLater',
            talkNotes => ({ watchLater: !talkNotes.watchLater }),
        );
    }

    return {
        eventTalkStats,
        talkNotes: talkNoteRef,
        toggleFavorite,
        toggleWatchLater
    };
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

export type UserTalkNotesHook = ReturnType<typeof useUserTalkNotes>;

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
