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
  UpdateData, getDoc, query, CollectionReference, where, setDoc, updateDoc
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
import {useStorage} from "@vueuse/core";

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
    eventIdRef: Ref<EventId>,
    talkIdRef: Ref<TalkId | undefined>,
    maybeNoteRef: Ref<TalkNote|undefined> | undefined,
    onTalkNoteUpdated: (updatedTalkNote: TalkNote) => void = () => {}
) {

    PERF_LOGGER.debug(() => `useUserTalkNoteActions(${unref(eventIdRef)?.value}, ${unref(talkIdRef)?.value})`)

    const userRef = useCurrentUser()

    const localEventTalkFavsRef = useLocalEventTalkFavsStorage(eventIdRef)

    const updateTalkNotesDocument = async (
        callContextName: string,
        talkNoteUpdater: (talkNote: TalkNote) => Partial<TalkNote>,
        afterUpdate: (updatedTalkNote: TalkNote) => Promise<void>|void = () => {}
    ) => {
        const eventId = toValue(eventIdRef),
            talkId = toValue(talkIdRef),
            user = toValue(userRef),
            firestoreUserTalkNotesDoc = getTalkNotesRef(user, eventId, talkId),
            maybeNote = toValue(maybeNoteRef);

        if(!eventId || !user || !talkId) {
            LOGGER.warn(() => `${callContextName}() called with an undefined eventId/user/talkId`)
            return;
        }

        if(!firestoreUserTalkNotesDoc) {
            LOGGER.warn(() => `${callContextName}() called with an undefined firestoreUserTalkNotes/firestoreUserTalkNotesDoc (is eventId/dayId/user defined ?)`)
            return;
        }

        if(!maybeNote) {
          LOGGER.warn(() => `${callContextName}() called with an undefined maybeNote`)
          return;
        }

        const talkNote = maybeNote;
        const fieldsToUpdate = talkNoteUpdater(talkNote);
        const updatedTalkNotes = {
          ...talkNote,
          ...fieldsToUpdate
        }

        // Updating quickly (without blocking through an await if this is possible) the note reference
        // so that we can give a quick feedback to user
        onTalkNoteUpdated(updatedTalkNotes);

        const serverTalkNote = (await getDoc(firestoreUserTalkNotesDoc));
        if(!serverTalkNote.exists()) {
          setDoc(firestoreUserTalkNotesDoc, {
            userId: user.uid,
            note: updatedTalkNotes
          })
        } else {
          const translatedUpdatedData = Object.entries(fieldsToUpdate).reduce((updated, [key, value]) => {
            updated[`note.${key}`] = value;
            return updated;
          }, {} as UpdateData<any>)

          updateDoc(firestoreUserTalkNotesDoc, translatedUpdatedData)
        }

        await afterUpdate(updatedTalkNotes);
    }

    const toggleFavorite = async (currentStatusIsFavorited: boolean) => {
        const talkId = toValue(talkIdRef);
        if(talkId) {
          if(localEventTalkFavsRef.value.has(talkId.value)) {
            localEventTalkFavsRef.value.delete(talkId.value)
          } else {
            localEventTalkFavsRef.value.set(talkId.value, currentStatusIsFavorited ? -1 : 1)
          }
        }

        await updateTalkNotesDocument(
            'toggleFavorite',
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

export function useLocalEventTalkFavsStorage(eventIdRef: Ref<EventId>) {
  return useStorage(`event-${eventIdRef.value.value}-local-talk-favs`, new Map<string, 1|-1>(), undefined, {
    serializer: {
      read: (value: any) => new Map<string, 1|-1>(value ? Object.entries(JSON.parse(value)) : []),
      write: (value: Map<string, 1|-1>) => JSON.stringify(Object.fromEntries(value.entries()))
    }
  })
}

export function useUserEventTalkNotes(eventIdRef: Ref<EventId>, talkIdsRef: Ref<TalkId[]|undefined>) {
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
              firestoreUserTalkNotesByTalkIdRef.value.set(talkId.value, {
                talkId: talkId?.value || '???',
                isFavorite: false,
                watchLater: null,
              });
            })
        },
        (change, talkId, collectionRef) => {
            match(change)
                .with({type:'created'}, change => { collectionRef.value.set(talkId, change.createdDoc) })
                .with({type:'updated'}, change => { collectionRef.value.set(talkId, change.updatedDoc) })
                .with({type:'deleted'}, change => { collectionRef.value.delete(talkId) })
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
