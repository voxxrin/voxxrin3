import {EventId} from "@/models/VoxxrinEvent";
import {computed, ComputedRef, Ref, toValue, unref, watch} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    collection,
    doc,
    DocumentReference, updateDoc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {TalkFeedbacksViewerToken, VoxxrinUserTokensWallet} from "@/models/VoxxrinUser";
import {createSharedComposable} from "@vueuse/core";
import {
    EventOrganizerSecretToken,
    UserTokensWallet
} from "../../../shared/user-tokens-wallet.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {
    Unreffable,
    deferredVuefireUseDocument
} from "@/views/vue-utils";
import {TalkFeedbacksViewerSecretToken} from "../../../shared/conference-organizer-space.firestore";
import { arrayUnion } from "firebase/firestore";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {User} from "firebase/auth";

const LOGGER = Logger.named("useUserTokensWallet");

function getUserTokensWalletDoc(user: User|null|undefined) {
    if(!user) {
        return undefined;
    }

    return doc(collection(doc(collection(db,
            'users'), user.uid),
        'tokens-wallet'), 'self'
    ) as DocumentReference<UserTokensWallet>;
}
export function useUserTokensWallet() {

    PERF_LOGGER.debug(() => `useUserTokensWallet()`)

    const userRef = useCurrentUser()

    const firestoreUserTokensWalletRef = deferredVuefireUseDocument([userRef],
        ([user]) => getUserTokensWalletDoc(user));

    const voxxrinUserTokensWallet: ComputedRef<VoxxrinUserTokensWallet|undefined> = computed(() => {
        const firestoreUserTokensWallet = unref(firestoreUserTokensWalletRef)

        if(!firestoreUserTokensWallet) {
            return undefined;
        }

        const walletEntry: VoxxrinUserTokensWallet = {
            publicUserToken: firestoreUserTokensWallet.publicUserToken,
            privateUserId: firestoreUserTokensWallet.privateUserId,
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
        return walletEntry;
    })

    const registerEventOrganizerSecretToken = async (eventOrganizerSecretToken: EventOrganizerSecretToken) => {
        const user = toValue(userRef);
        const firestoreUserTokensWalletDoc = getUserTokensWalletDoc(user);

        if(!firestoreUserTokensWalletDoc) {
            LOGGER.error(() => `firestoreUserTokensWalletDoc is undefined !`)
            return;
        }

        // Important note: array union prevents duplicates, which is perfect 👌
        await updateDoc(firestoreUserTokensWalletDoc, "secretTokens.eventOrganizerTokens", arrayUnion(eventOrganizerSecretToken));
    }

    const registerTalkFeedbacksViewerSecretToken = async (talkFeedbacksViewerSecretToken: TalkFeedbacksViewerSecretToken) => {
        const user = toValue(userRef);
        const firestoreUserTokensWalletDoc = getUserTokensWalletDoc(user);

        if(!firestoreUserTokensWalletDoc) {
            LOGGER.error(() => `firestoreUserTokensWalletDoc is undefined !`)
            return;
        }

        // Important note: array union prevents duplicates, which is perfect 👌
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
        }) as Ref<TalkFeedbacksViewerToken[]>
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
