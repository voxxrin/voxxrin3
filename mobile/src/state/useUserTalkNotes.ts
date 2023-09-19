import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {computed, Ref, unref} from "vue";
import {useTalkStats} from "@/state/useEventTalkStats";
import {useDocument} from "vuefire";
import {useCurrentUser} from "@/state/useCurrentUser";
import {Unreffable} from "@/views/vue-utils";
import {
    collection,
    doc,
    DocumentReference,
    setDoc,
    updateDoc,
    UpdateData
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkNote, UserComputedEventInfos, UserTalkNote} from "../../../shared/feedbacks.firestore";
import {Logger, PERF_LOGGER} from "@/services/Logger";

const LOGGER = Logger.named("useUserTalkNotes");

export function useUserTalkNotes(
    eventIdRef: Unreffable<EventId | undefined>,
    talkIdRef: Unreffable<TalkId | undefined>) {

    PERF_LOGGER.debug(() => `useUserTalkNotes(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})`)

    const userRef = useCurrentUser()

    const firestoreUserTalkNotesSource = computed(() => {
        const eventId = unref(eventIdRef),
            user = unref(userRef),
            talkId = unref(talkIdRef);

        if(!eventId || !eventId.value || !user || !talkId || !talkId.value) {
            return undefined;
        }

        return doc(collection(doc(collection(doc(collection(db,
                    'users'), user.uid),
                'events'), eventId.value),
            'talksNotes'), talkId.value
        ) as DocumentReference<UserTalkNote>
    });

    const { eventTalkStats, incrementInMemoryTotalFavoritesCount, decrementInMemoryTotalFavoritesCount } = useTalkStats(eventIdRef, talkIdRef)

    const firestoreUserTalkNotesRef = useDocument(firestoreUserTalkNotesSource);

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
        const firestoreUserTalkNotesDoc = unref(firestoreUserTalkNotesSource),
            firestoreUserTalkNotes = unref(firestoreUserTalkNotesRef),
            talkId = unref(talkIdRef),
            user = unref(userRef);

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


export function useUserEventAllFavoritedTalkIds(eventIdRef: Unreffable<EventId | undefined>) {

    PERF_LOGGER.debug(() => `useUserEventAllFavoritedTalkIds(${unref(eventIdRef)?.value})`)
    const userRef = useCurrentUser()

    const firestoreUserAllFavoritedTalkIdsSource = computed(() => {
        const eventId = unref(eventIdRef),
            user = unref(userRef);

        if(!eventId || !eventId.value || !user) {
            return undefined;
        }

        return doc(collection(doc(collection(doc(collection(db,
                    'users'), user.uid),
                'events'), eventId.value),
            '__computed'), "self"
        ) as DocumentReference<UserComputedEventInfos>
    });

    const firestoreUserAllFavoritedTalkIdsRef = useDocument(firestoreUserAllFavoritedTalkIdsSource);

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

export function prepareUserTalkNotes(
    eventId: EventId,
    dayAndTalkIds: Array<{dayId: DayId, talkId: TalkId}>
) {
    dayAndTalkIds.forEach(dayAndTalkId => {
        useUserTalkNotes(eventId, dayAndTalkId.talkId);
    })
}
