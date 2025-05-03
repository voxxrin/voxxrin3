import {EventId} from "@/models/VoxxrinEvent";
import {computed, ComputedRef, toValue, unref} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    collection,
    doc,
    DocumentReference,
    setDoc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {UserPreferences} from "@shared/user-preferences.firestore";
import {VoxxrinUserPreferences} from "@/models/VoxxrinUser";
import {createSharedComposable} from "@vueuse/core";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {deferredVuefireUseDocument} from "@/views/vue-utils";
import {User} from "firebase/auth";

const LOGGER = Logger.named("useUserPreferences");

function getUserPreferencesDoc(user: User|undefined|null) {
    if(!user) {
        return undefined;
    }

    return doc(collection(doc(collection(db,
            'users'), user.uid),
        'preferences'), 'self'
    ) as DocumentReference<UserPreferences>;
}

export function useUserPreferences() {

    PERF_LOGGER.debug(() => `useUserPreferences()`)

    const userRef = useCurrentUser()

    const firestoreUserPreferencesRef = deferredVuefireUseDocument([userRef],
        ([user]) => getUserPreferencesDoc(user));

    async function onceUserPreferenceAvailable(call: (firestoreUserPref: UserPreferences, firestoreUserPrefDoc: DocumentReference<UserPreferences>) => Promise<void>) {
        const user = toValue(userRef);
        const firestoreUserPrefDoc = getUserPreferencesDoc(user);
        let firestoreUserPref = toValue(firestoreUserPreferencesRef);

        if(!firestoreUserPrefDoc) {
            return;
        }

        if(!firestoreUserPref) {
            // Let's create an empty user preferences container
            firestoreUserPref = {
                pinnedEventIds: [],
            }
            await setDoc(firestoreUserPrefDoc, firestoreUserPref);
        }

        await call(firestoreUserPref, firestoreUserPrefDoc);
    }
    const pinEvent = async (eventId: EventId) => {
        await onceUserPreferenceAvailable(async (firestoreUserPref, firestoreUserPrefDoc) => {
            if(firestoreUserPref.pinnedEventIds.includes(eventId.value)) {
                return;
            }

            // This is not an atomic operation ... but keeps code simple
            // If we would want atomic firebase operation, we should :
            // - use arrayUnion() for pinning (that's simple)
            // - use firebase transaction for unpinng (that's more complex)
            await setDoc(firestoreUserPrefDoc, {
                ...firestoreUserPref,
                pinnedEventIds: firestoreUserPref.pinnedEventIds.concat([ eventId.value ])
            });
        })
    }
    const unpinEvent = async (eventId: EventId) => {
        await onceUserPreferenceAvailable(async (firestoreUserPref, firestoreUserPrefDoc) => {
            if(!firestoreUserPref.pinnedEventIds.includes(eventId.value)) {
                return;
            }

            // This is not an atomic operation ... but keeps code simple
            // If we would want atomic firebase operation, we should :
            // - use arrayUnion() for pinning (that's simple)
            // - use firebase transaction for unpinng (that's more complex)
            await setDoc(firestoreUserPrefDoc, {
                ...firestoreUserPref,
                pinnedEventIds: firestoreUserPref.pinnedEventIds.filter(id => eventId.value !== id)
            });
        })
    }

    const voxxrinUserPreferences: ComputedRef<VoxxrinUserPreferences|undefined> = computed(() => {
        const firestoreUserPref = unref(firestoreUserPreferencesRef)

        if(!firestoreUserPref) {
            return undefined;
        }

        return {
            ...firestoreUserPref,
            pinnedEventIds: firestoreUserPref.pinnedEventIds.map(rawId => new EventId(rawId))
        }
    })

    return {
        userPreferences: voxxrinUserPreferences,
        pinEvent, unpinEvent
    };
}

export const useSharedUserPreferences = createSharedComposable(useUserPreferences);
