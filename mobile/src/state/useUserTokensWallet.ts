import {EventId} from "@/models/VoxxrinEvent";
import {computed, Ref, unref} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
  TalkFeedbacksViewerToken,
  toRawUserTokensWallet,
  toVoxxrinUserTokensWallet,
  toVoxxrinUserWalletEventOrganizerSecretToken,
  toVoxxrinUserWalletTalkFeedbacksViewerToken,
  VoxxrinUserTokensWallet
} from "@/models/VoxxrinUser";
import {createSharedComposable, useStorage} from "@vueuse/core";
import {
  UserWalletEventOrganizerSecretToken,
  UserWalletTalkFeedbacksViewerSecretToken
} from "../../../shared/user-tokens-wallet.localstorage";
import {Unreffable} from "@/views/vue-utils";
import {Logger, PERF_LOGGER} from "@/services/Logger";

const LOGGER = Logger.named("useUserTokensWallet");

export function useUserTokensWallet() {

    PERF_LOGGER.debug(() => `useUserTokensWallet()`)

    const userRef = useCurrentUser()

    const voxxrinUserTokensWallet = useStorage(`user:${userRef.value?.uid}:tokens-wallet`, undefined, undefined, {
      serializer: {
        read: (value: any): VoxxrinUserTokensWallet|undefined => (value ? toVoxxrinUserTokensWallet(JSON.parse(value)) : {
          secretTokens: {
            eventOrganizerTokens: [],
            talkFeedbacksViewerTokens: []
          }
        }),
        write: (value: VoxxrinUserTokensWallet|undefined) => value ? JSON.stringify(toRawUserTokensWallet(value)) : ""
      }
    })

    const registerEventOrganizerSecretToken = async (eventOrganizerSecretToken: UserWalletEventOrganizerSecretToken) => {
        voxxrinUserTokensWallet.value = {
          secretTokens: {
            eventOrganizerTokens: (voxxrinUserTokensWallet.value?.secretTokens.eventOrganizerTokens || []).concat(toVoxxrinUserWalletEventOrganizerSecretToken(eventOrganizerSecretToken)),
            talkFeedbacksViewerTokens: (voxxrinUserTokensWallet.value?.secretTokens.talkFeedbacksViewerTokens || [])
          }
        }
    }

    const registerTalkFeedbacksViewerSecretToken = async (talkFeedbacksViewerSecretToken: UserWalletTalkFeedbacksViewerSecretToken) => {
        voxxrinUserTokensWallet.value = {
          secretTokens: {
            eventOrganizerTokens: (voxxrinUserTokensWallet.value?.secretTokens.eventOrganizerTokens || []),
            talkFeedbacksViewerTokens: (voxxrinUserTokensWallet.value?.secretTokens.talkFeedbacksViewerTokens || []).concat(toVoxxrinUserWalletTalkFeedbacksViewerToken(talkFeedbacksViewerSecretToken))
          }
        }
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
