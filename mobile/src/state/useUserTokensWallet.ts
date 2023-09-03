import {EventId} from "@/models/VoxxrinEvent";
import {computed, ComputedRef, unref} from "vue";
import {useDocument} from "vuefire";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    collection,
    doc,
    DocumentReference, updateDoc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {VoxxrinUserTokensWallet} from "@/models/VoxxrinUser";
import {createSharedComposable} from "@vueuse/core";
import {
    EventOrganizerSecretToken,
    UserTokensWallet
} from "../../../shared/user-tokens-wallet.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {Unreffable} from "@/views/vue-utils";
import {TalkFeedbacksViewerSecretToken} from "../../../shared/conference-organizer-space.firestore";
import { arrayUnion } from "firebase/firestore";

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

    const firestoreUserTokensWalletRef = useDocument(firestoreUserTokensWalletSource);

    const voxxrinUserTokensWallet: ComputedRef<VoxxrinUserTokensWallet|undefined> = computed(() => {
        const firestoreUserTokensWallet = unref(firestoreUserTokensWalletRef)

        if(!firestoreUserTokensWallet) {
            return undefined;
        }

        return {
            publicUserToken: firestoreUserTokensWallet.publicUserToken,
            secretTokens: {
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

    return {
        userTokensWalletRef: voxxrinUserTokensWallet,
        registerEventOrganizerSecretToken,
        registerTalkFeedbacksViewerSecretToken,
        talkFeedbackViewerTokensRefForEvent,
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
