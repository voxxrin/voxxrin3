import {SpacedEventId, stringifySpacedEventId} from "@/models/VoxxrinEvent";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {Ref, toValue, unref} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {deferredVuefireUseCollection, MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES,} from "@/views/vue-utils";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  query,
  setDoc,
  UpdateData,
  updateDoc,
  where
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkNote, UserTalkNote} from "@shared/feedbacks.firestore";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {User} from 'firebase/auth';
import {Temporal} from "temporal-polyfill";
import {checkCache} from "@/services/Cachings";
import {CompletablePromiseQueue, partitionArray, toValueObjectValues} from "@/models/utils";
import {match} from "ts-pattern";
import {useStorage} from "@vueuse/core";
import {getLocalStorageKeyCompound} from "@/services/Spaces";
import {resolvedEventFirestorePath} from "@shared/utilities/event-utils";

const LOGGER = Logger.named("useUserTalkNotes");

function getTalkNotesRef(
  user: User|undefined|null,
  spacedEventId: SpacedEventId|undefined,
  talkId: TalkId|undefined
): DocumentReference<UserTalkNote>|undefined {
    if(!spacedEventId || !spacedEventId.eventId || !spacedEventId.eventId.value || !user || !talkId || !talkId.value) {
        return undefined;
    }

    return doc(
      db,
      `/users/${user.uid}/${resolvedEventFirestorePath(spacedEventId.eventId.value, spacedEventId.spaceToken?.value)}/talksNotes/${talkId.value}`
    ) as DocumentReference<UserTalkNote>
}

export function useUserTalkNoteActions(
    spacedEventIdRef: Ref<SpacedEventId>,
    talkIdRef: Ref<TalkId | undefined>,
    maybeNoteRef: Ref<TalkNote|undefined> | undefined,
    onTalkNoteUpdated: (updatedTalkNote: TalkNote) => void = () => {}
) {

    PERF_LOGGER.debug(() => `useUserTalkNoteActions(${stringifySpacedEventId(unref(spacedEventIdRef))}, ${unref(talkIdRef)?.value})`)

    const userRef = useCurrentUser()

    const localEventTalkFavsRef = useLocalEventTalkFavsStorage(spacedEventIdRef)

    const updateTalkNotesDocument = async (
        callContextName: string,
        talkNoteUpdater: (talkNote: TalkNote) => Partial<TalkNote>,
        afterUpdate: (updatedTalkNote: TalkNote) => Promise<void>|void = () => {}
    ) => {
        const spacedEventId = toValue(spacedEventIdRef),
            talkId = toValue(talkIdRef),
            user = toValue(userRef),
            firestoreUserTalkNotesDoc = getTalkNotesRef(user, spacedEventId, talkId),
            maybeNote = toValue(maybeNoteRef);

        if(!spacedEventId || !spacedEventId.eventId || !spacedEventId.eventId.value || !user || !talkId) {
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

function getUserEventTalkNotesSources(user: User|null|undefined, spacedEventId: SpacedEventId|undefined, talkIds: TalkId[]|undefined) {
    if(!user || !spacedEventId || !spacedEventId.eventId || !spacedEventId.eventId.value || !talkIds || !talkIds.length) {
        return undefined;
    }

    return partitionArray(talkIds, MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES).map(partitionnedTalkIds =>
        query(collection(
            db,
            `/users/${user.uid}/${resolvedEventFirestorePath(spacedEventId.eventId.value, spacedEventId.spaceToken?.value)}/talksNotes`
          ), where("note.talkId", 'in', partitionnedTalkIds.map(id => id.value))
        ) as CollectionReference<UserTalkNote>
    );
}

export function useLocalEventTalkFavsStorage(spacedEventIdRef: Ref<SpacedEventId>) {
  return useStorage(`event-${getLocalStorageKeyCompound(spacedEventIdRef)}-local-talk-favs`, new Map<string, 1|-1>(), undefined, {
    serializer: {
      read: (value: any) => new Map<string, 1|-1>(value ? Object.entries(JSON.parse(value)) : []),
      write: (value: Map<string, 1|-1>) => JSON.stringify(Object.fromEntries(value.entries()))
    }
  })
}

export function useUserEventTalkNotes(spacedEventIdRef: Ref<SpacedEventId>, talkIdsRef: Ref<TalkId[]|undefined>) {
    PERF_LOGGER.debug(() => `useUserEventTalkNotes(${stringifySpacedEventId(toValue(spacedEventIdRef))}, talkIds=${toValueObjectValues(toValue(talkIdsRef))})`)
    const userRef = useCurrentUser()

    const userEventTalkNotesRef = deferredVuefireUseCollection(
        [spacedEventIdRef, userRef, talkIdsRef],
        ([spacedEventId, user, talkIds]) => getUserEventTalkNotesSources(user, spacedEventId, talkIds),
        firestoreUserTalkNote => firestoreUserTalkNote.note, // TODO: transform to Voxxrin ???
        (firestoreUserTalkNotesByTalkIdRef, spacedEventId, user, talkIds) => {
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
    spacedEventId: SpacedEventId,
    dayId: DayId,
    talks: Array<VoxxrinTalk>,
    promisesQueue: CompletablePromiseQueue
) {
    return checkCache(`prepareUserTalkNotes(${stringifySpacedEventId(spacedEventId)}, dayId=${dayId.value})`, Temporal.Duration.from({ hours: 24 }), async () => {
        PERF_LOGGER.debug(`prepareUserTalkNotes(user=${user.uid}, spacedEventId=${stringifySpacedEventId(spacedEventId)}, talkIds=${JSON.stringify(talks.map(talk => talk.id.value))})`)
        promisesQueue.addAll(talks.map(talk => {
          return async () => {
            const talkNotesRef = getTalkNotesRef(user, spacedEventId, talk.id);
            if(talkNotesRef) {
              await getDoc(talkNotesRef)
              PERF_LOGGER.debug(`getDoc(${talkNotesRef.path})`)
            }
          }
        }), { priority: 10 })
    })
}
