import {EventId} from "@/models/VoxxrinEvent";
import {computed, ComputedRef, unref} from "vue";
import {useDocument} from "vuefire";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    collection,
    doc,
    DocumentReference, updateDoc,
} from "firebase/firestore";
import {db, messaging, onceServiceWorkerRegistered} from "@/state/firebase";
import {VoxxrinUserTokensWallet} from "@/models/VoxxrinUser";
import {createSharedComposable} from "@vueuse/core";
import {
    EventOrganizerSecretToken, FirebaseMessagingToken,
    UserTokensWallet
} from "../../../shared/user-tokens-wallet.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {Unreffable} from "@/views/vue-utils";
import {TalkFeedbacksViewerSecretToken} from "../../../shared/conference-organizer-space.firestore";
import { arrayUnion } from "firebase/firestore";
import {getToken} from "firebase/messaging";
import {getPlatform} from "@/models/Platforms";
import {ISODatetime} from "../../../shared/type-utils";

export function useUserTokensWallet() {

    console.debug(`useUserTokensWallet()`)

    const userRef = useCurrentUser()

    const firestoreUserTokensWalletSource = computed(() => {
        const user = unref(userRef);

        if(!user) {
            return undefined;
        }

        return doc(collection(doc(collection(db,
            'users'), user.uid),
            'tokens-wallet'), 'self'
        ) as DocumentReference<UserTokensWallet>
    });

    const firestoreUserTokensWalletRef = useDocument<UserTokensWallet>(firestoreUserTokensWalletSource);

    const voxxrinUserTokensWallet: ComputedRef<VoxxrinUserTokensWallet|undefined> = computed(() => {
        const firestoreUserTokensWallet = unref(firestoreUserTokensWalletRef)

        if(!firestoreUserTokensWallet) {
            return undefined;
        }

        const walletEntry: VoxxrinUserTokensWallet = {
            publicUserToken: firestoreUserTokensWallet.publicUserToken,
            privateUserId: firestoreUserTokensWallet.privateUserId,
            secretTokens: {
                ...firestoreUserTokensWallet.secretTokens,
                eventOrganizerTokens: firestoreUserTokensWallet.secretTokens.eventOrganizerTokens.map(fsOrgToken => ({
                    ...fsOrgToken,
                    eventId: new EventId(fsOrgToken.eventId)
                })),
                talkFeedbacksViewerTokens: firestoreUserTokensWallet.secretTokens.talkFeedbacksViewerTokens.map(fsFeedbackToken => ({
                    ...fsFeedbackToken,
                    eventId: new EventId(fsFeedbackToken.eventId),
                    talkId: new TalkId(fsFeedbackToken.talkId),
                })),
            }
        }
        return walletEntry;
    })

    const registerEventOrganizerSecretToken = async (eventOrganizerSecretToken: EventOrganizerSecretToken) => {
        const firestoreUserTokensWalletDoc = unref(firestoreUserTokensWalletSource);

        if(!firestoreUserTokensWalletDoc) {
            console.error(`firestoreUserTokensWalletDoc is undefined !`)
            return;
        }

        await updateDoc(firestoreUserTokensWalletDoc, "secretTokens.eventOrganizerTokens", arrayUnion(eventOrganizerSecretToken));
    }

    const registerTalkFeedbacksViewerSecretToken = async (talkFeedbacksViewerSecretToken: TalkFeedbacksViewerSecretToken) => {
        const firestoreUserTokensWalletDoc = unref(firestoreUserTokensWalletSource);

        if(!firestoreUserTokensWalletDoc) {
            console.error(`firestoreUserTokensWalletDoc is undefined !`)
            return;
        }

        await updateDoc(firestoreUserTokensWalletDoc, "secretTokens.talkFeedbacksViewerTokens", arrayUnion(talkFeedbacksViewerSecretToken));
    }

    const talkFeedbackViewerTokensRefForEvent = (eventIdRef: Unreffable<EventId|undefined>) => {
        return computed(() => {
            const userTokensWallet = unref(voxxrinUserTokensWallet);
            const eventId = unref(eventIdRef);

            if(!userTokensWallet || !eventId) {
                return undefined;
            }

            return userTokensWallet.secretTokens.talkFeedbacksViewerTokens.filter(
                t => t.eventId.isSameThan(eventId)
            )
        })
    }

    const ensureFirebaseMessagingSecretTokenRegistered = async () => {
        const user = unref(userRef);
        const firestoreUserTokensWallet = unref(firestoreUserTokensWalletRef);
        const firestoreUserTokensWalletDoc = unref(firestoreUserTokensWalletSource);

        if(!user) {
            console.error(`user is undefined in ensureFirebaseMessagingSecretTokenRegistered() !`)
            return;
        }
        if(!firestoreUserTokensWalletDoc) {
            console.error(`firestoreUserTokensWalletDoc is undefined for user ${user?.uid} !`)
            return;
        }
        if(!firestoreUserTokensWallet) {
            console.error(`firestoreUserTokensWallet is undefined for user ${user?.uid} !`)
            return;
        }

        const registration = await onceServiceWorkerRegistered
        let firebaseMessagingToken: string|undefined = undefined
        try {
            firebaseMessagingToken = await getToken(messaging, {
                serviceWorkerRegistration: registration,
                vapidKey: import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY,
            })
        }catch(err) {
            console.error(`Error while retrieving firebase token: ${err}`)
        }

        if(firebaseMessagingToken) {
            const firebaseMessagingSecretToken: FirebaseMessagingToken = {
                secretToken: firebaseMessagingToken,
                platform: getPlatform(),
                registeredOn: new Date().toISOString() as ISODatetime
            }

            if(!firestoreUserTokensWallet.secretTokens.firebaseMessagingTokens) {
                await updateDoc(firestoreUserTokensWalletDoc, "secretTokens.firebaseMessagingTokens", [ firebaseMessagingSecretToken ])
                console.log(`Firebase token registered for user ${user?.uid}: ${firebaseMessagingSecretToken}`)
            } else if(!!firestoreUserTokensWallet.secretTokens.firebaseMessagingTokens.find(
                messagingToken => messagingToken.secretToken === firebaseMessagingSecretToken.secretToken
            )) {
                // Firebase token already exists, that's fine !
                return;
            } else {
                await updateDoc(firestoreUserTokensWalletDoc, "secretTokens.firebaseMessagingTokens", arrayUnion(firebaseMessagingSecretToken));
                console.log(`Firebase token registered for user ${user?.uid}: ${firebaseMessagingSecretToken}`)
            }
        }
    }



    return {
        userTokensWalletRef: voxxrinUserTokensWallet,
        registerEventOrganizerSecretToken,
        registerTalkFeedbacksViewerSecretToken,
        talkFeedbackViewerTokensRefForEvent,
        ensureFirebaseMessagingSecretTokenRegistered,
        organizerTokenRefForEvent: (eventIdRef: Unreffable<EventId|undefined>) => {
            return computed(() => {
                const userTokensWallet = unref(voxxrinUserTokensWallet);
                const eventId = unref(eventIdRef);

                if(!userTokensWallet || !eventId) {
                    return undefined;
                }

                const eventOrganizerToken = userTokensWallet.secretTokens.eventOrganizerTokens.find(t => t.eventId.isSameThan(eventId))
                if(!eventOrganizerToken) {
                    return undefined;
                }

                return eventOrganizerToken.secretToken;
            })
        }
    };
}

export const useSharedUserTokensWallet = createSharedComposable(useUserTokensWallet);
