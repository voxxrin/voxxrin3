import {EventId} from "@/models/VoxxrinEvent";
import {computed, ComputedRef, unref} from "vue";
import {useDocument} from "vuefire";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    collection,
    doc,
    DocumentReference,
    setDoc, updateDoc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {UserPreferences} from "../../../shared/user-preferences.firestore";
import {VoxxrinUserPreferences} from "@/models/VoxxrinUser";
import {createSharedComposable} from "@vueuse/core";

export function useUserPreferences() {

    console.debug(`useUserPreferences()`)

    const userRef = useCurrentUser()

    const firestoreUserPreferencesSource = computed(() => {
        const user = unref(userRef);

        if(!user) {
            return undefined;
        }

        return doc(collection(doc(collection(db,
            'users'), user.uid),
            'preferences'), 'self'
        ) as DocumentReference<UserPreferences>
    });

    const firestoreUserPreferencesRef = useDocument(firestoreUserPreferencesSource);

    async function onceUserPreferenceAvailable(call: (firestoreUserPref: UserPreferences, firestoreUserPrefDoc: DocumentReference<UserPreferences>) => Promise<void>) {
        const firestoreUserPrefDoc = unref(firestoreUserPreferencesSource);
        let firestoreUserPref = unref(firestoreUserPreferencesRef);

        if(!firestoreUserPrefDoc) {
            return;
        }

        if(!firestoreUserPref) {
            // Let's create an empty user preferences container
            firestoreUserPref = {
                pinnedEventIds: [],
                showPastEvents: false
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

    const togglePastEvent = async (showPastEvents: boolean) => {
        await onceUserPreferenceAvailable(async (firestoreUserPref, firestoreUserPrefDoc) => {
            if(firestoreUserPref.showPastEvents === showPastEvents) {
                return;
            }

            await updateDoc(firestoreUserPrefDoc, "showPastEvents", showPastEvents);
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
        pinEvent, unpinEvent, togglePastEvent
    };
}

export const useSharedUserPreferences = createSharedComposable(useUserPreferences);
