import {EventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {computed, Ref, unref} from "vue";
import {useTalkStats} from "@/state/useEventTalkStats";
import {useCurrentUser, useDocument} from "vuefire";
import {Unreffable} from "@/views/vue-utils";
import {collection, doc, DocumentReference, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import {db} from "@/state/firebase";
import {UserDayTalksNotes, UserTalkNotes} from "../../../shared/feedbacks.firestore";
import {match, P} from "ts-pattern";

export function useUserTalkNotes(
    eventIdRef: Unreffable<EventId | undefined>,
    // FIXME: talk stats should not be dependent on days, in case talk is moved from
    // one day to another
    dayIdRef: Unreffable<DayId | undefined>,
    talkIdRef: Unreffable<TalkId | undefined>) {

    const userRef = useCurrentUser()

    const firestoreUserTalkNotesSource = computed(() => {
        const eventId = unref(eventIdRef),
            dayId = unref(dayIdRef),
            user = unref(userRef);

        if(!eventId || !eventId.value || !dayId || !dayId.value || !user) {
            return undefined;
        }

        return doc(collection(doc(collection(doc(collection(db,
            'users'), user.uid),
            'events'), eventId.value),
            'talksNotes'), dayId.value
        ) as DocumentReference<UserDayTalksNotes>
    });

    const { eventTalkStats, incrementInMemoryTotalFavoritesCount, decrementInMemoryTotalFavoritesCount } = useTalkStats(eventIdRef, dayIdRef, talkIdRef)

    const firestoreUserTalkNotesRef = useDocument(firestoreUserTalkNotesSource);

    const arrayTalkNotesRef = computed(() => {
        const talkId = unref(talkIdRef),
            firestoreUserTalkNotes = unref(firestoreUserTalkNotesRef);

        if(!talkId || !talkId.value) {
            return undefined;
        }

        // Get index of notes if an entry already exists
        const [maybeTalkNotesIndex, maybeFirestoreUserTalkNote] = match<[typeof firestoreUserTalkNotes], [number|undefined, UserTalkNotes|undefined]>([firestoreUserTalkNotes])
            .with([P.nullish], ([_1]) => [undefined, undefined])
            .with([P.not(P.nullish)], ([firestoreUserTalkNotes]) => {
                const talkStatsIndex = firestoreUserTalkNotes.notes.findIndex(note => note.talkId === talkId.value);
                if(talkStatsIndex === -1) {
                    return [undefined, undefined];
                } else {
                    return [talkStatsIndex, firestoreUserTalkNotes.notes[talkStatsIndex]];
                }
            }).run();

        // Returning existing entry or a new default default entry container
        return match<[typeof maybeTalkNotesIndex, typeof maybeFirestoreUserTalkNote], {talkNotesIndex: number|undefined, talkNotes: UserTalkNotes}>([maybeTalkNotesIndex, maybeFirestoreUserTalkNote])
            .with([P.any, P.nullish], ([_1, _2]) => {
                // Fallback when no talk notes are found for current user/event/talk
                return {
                    talkNotesIndex: undefined,
                    talkNotes: {
                        talkId: talkId.value,
                        isFavorite: false,
                        watchLater: null,
                        ratings: {
                            bingo: null,
                            scale: null
                        },
                        comment: null
                    }
                };
            }).with([P.any, P.not(P.nullish)],  ([talkNotesIndex, talkNotes]) => {
                return {
                    talkNotesIndex,
                    talkNotes
                }
            }).run();
    });

    const talkNotesRef = computed(() => {
        const arrayTalkNotes = unref(arrayTalkNotesRef)
        return arrayTalkNotes?.talkNotes;
    })

    const updateTalkNotesDocument = async (
        callContextName: string,
        talkNoteUpdater: (talkNotes: UserTalkNotes) => UserTalkNotes,
        afterUpdate: (updatedTalkNotes: UserTalkNotes) => Promise<void>|void = () => {}
    ) => {
        const arrayTalkNotes = unref(arrayTalkNotesRef),
            firestoreUserTalkNotesDoc = unref(firestoreUserTalkNotesSource),
            firestoreUserTalkNotes = unref(firestoreUserTalkNotesRef),
            dayId = unref(dayIdRef),
            user = unref(userRef);

        if(!user || !dayId || !dayId.value) {
            console.warn(`${callContextName}() called with an undefined user/dayId`)
            return;
        }

        if(!firestoreUserTalkNotesDoc) {
            console.warn(`${callContextName}() called with an undefined firestoreUserTalkNotes/firestoreUserTalkNotesDoc (is eventId/dayId/user defined ?)`)
            return;
        }

        if(!arrayTalkNotes) {
            console.warn(`${callContextName}() called with an undefined arrayTalkNotes (is talkId defined ?)`)
            return;
        }

        const updatedTalkNotes = talkNoteUpdater(arrayTalkNotes.talkNotes);

        // 3 cases :
        // - no entry exist for current user / event / day
        // - entry exist, but nothing exists for current talk id (we need to create e new note)
        // - entry exist for talk, we need to update this entry
        await match([firestoreUserTalkNotes, arrayTalkNotes.talkNotesIndex])
            .with([P.nullish, P.any], async () => {
                const dayTalksNotes: UserDayTalksNotes = {
                    userId: user.uid,
                    day: dayId.value,
                    notes: [ updatedTalkNotes ]
                };
                await setDoc(firestoreUserTalkNotesDoc, dayTalksNotes);
            }).with([P.not(P.nullish), P.nullish], async ([userTalkNotes, _]) => {
                await updateDoc(firestoreUserTalkNotesDoc, { notes: arrayUnion(updatedTalkNotes) });
            }).with([P.not(P.nullish), P.not(P.nullish)], async ([userTalkNotes, talkNotesIndex]) => {
                // That's not an "atomic" update, but seems like we're only able to update arrays of simple
                // values atomically (through arrayunion())
                // Unfortunately, we're not able to provide any hash function to arrayunion(), so we'll consider
                // there are very low chances the same user updates existing notes from the same event multiple times
                userTalkNotes.notes[talkNotesIndex] = updatedTalkNotes;
                await updateDoc(firestoreUserTalkNotesDoc, { notes: userTalkNotes.notes })
            }).run();

        await afterUpdate(updatedTalkNotes);
    }

    const toggleFavorite = async () => {
        await updateTalkNotesDocument(
            'toggleFavorite',
            talkNotes => ({ ...talkNotes, isFavorite: !talkNotes.isFavorite }),
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
            talkNotes => ({ ...talkNotes, watchLater: !talkNotes.watchLater }),
        );
    }

    return {
        eventTalkStats,
        talkNotes: talkNotesRef,
        toggleFavorite,
        toggleWatchLater
    };
}
