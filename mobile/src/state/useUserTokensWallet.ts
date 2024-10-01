import {EventId} from "@/models/VoxxrinEvent";
import {computed, Ref, unref} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
  EventOrganizerToken, PrivateSpaceToken,
  TalkFeedbacksViewerToken,
  toRawUserTokensWallet,
  toVoxxrinUserTokensWallet,
  toVoxxrinUserWalletEventOrganizerSecretToken, toVoxxrinUserWalletPrivateSpaceToken,
  toVoxxrinUserWalletTalkFeedbacksViewerToken,
  VoxxrinUserTokensWallet
} from "@/models/VoxxrinUser";
import {createSharedComposable} from "@vueuse/core";
import {
  UserWalletEventOrganizerSecretToken, UserWalletPrivateSpaceToken,
  UserWalletTalkFeedbacksViewerSecretToken
} from "../../../shared/user-tokens-wallet.localstorage";
import {Unreffable} from "@/views/vue-utils";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {useLocalStorage} from "@/state/state-utilities";

const LOGGER = Logger.named("useUserTokensWallet");

export function useUserTokensWallet() {
    PERF_LOGGER.debug(() => `useUserTokensWallet()`)

    const userRef = useCurrentUser()
    const storageKeyRef = computed(() => `user:${userRef.value?.uid}:tokens-wallet`)

    const { ref: voxxrinUserTokensWallet, writeStore: writeTokensWalletInStore } = useLocalStorage(storageKeyRef, {
      serializer: {
        read: (value: any): VoxxrinUserTokensWallet|undefined => (value ? toVoxxrinUserTokensWallet(JSON.parse(value)) : {
          secretTokens: {
            eventOrganizerTokens: [],
            talkFeedbacksViewerTokens: [],
            privateSpaceTokens: [],
          }
        }),
        write: (value: VoxxrinUserTokensWallet) => JSON.stringify(toRawUserTokensWallet(value))
      }
    })

    const registerEventOrganizerSecretToken = async (eventOrganizerSecretToken: UserWalletEventOrganizerSecretToken) => {
        const { eventOrganizerTokens } = (voxxrinUserTokensWallet.value?.secretTokens.eventOrganizerTokens || [])
          .concat(toVoxxrinUserWalletEventOrganizerSecretToken(eventOrganizerSecretToken))
          .reduce((result, eventOrganizerToken) => {
            if(!result.alreadyRegisteredTokens.has(eventOrganizerToken.secretToken)) {
              result.eventOrganizerTokens.push(eventOrganizerToken)
              result.alreadyRegisteredTokens.add(eventOrganizerToken.secretToken)
            }

            return result;
          }, {eventOrganizerTokens: [] as EventOrganizerToken[], alreadyRegisteredTokens: new Set<string>() })

        writeTokensWalletInStore({
          secretTokens: {
            eventOrganizerTokens,
            talkFeedbacksViewerTokens: (voxxrinUserTokensWallet.value?.secretTokens.talkFeedbacksViewerTokens || []),
            privateSpaceTokens: (voxxrinUserTokensWallet.value?.secretTokens.privateSpaceTokens || []),
          }
        });
    }

    const registerTalkFeedbacksViewerSecretToken = async (talkFeedbacksViewerSecretToken: UserWalletTalkFeedbacksViewerSecretToken) => {
        const { talkFeedbacksViewerTokens } = (voxxrinUserTokensWallet.value?.secretTokens.talkFeedbacksViewerTokens || [])
          .concat(toVoxxrinUserWalletTalkFeedbacksViewerToken(talkFeedbacksViewerSecretToken))
          .reduce((result, talkFeedbacksViewerToken) => {
            if(!result.alreadyRegisteredTokens.has(talkFeedbacksViewerToken.secretToken)) {
              result.talkFeedbacksViewerTokens.push(talkFeedbacksViewerToken)
              result.alreadyRegisteredTokens.add(talkFeedbacksViewerToken.secretToken)
            }

            return result;
          }, { talkFeedbacksViewerTokens: [] as TalkFeedbacksViewerToken[], alreadyRegisteredTokens: new Set<string>() })

        writeTokensWalletInStore({
          secretTokens: {
            eventOrganizerTokens: (voxxrinUserTokensWallet.value?.secretTokens.eventOrganizerTokens || []),
            talkFeedbacksViewerTokens,
            privateSpaceTokens: (voxxrinUserTokensWallet.value?.secretTokens.privateSpaceTokens || []),
          }
        });
    }

    const registerPrivateSpaceSecretToken = async (privateSpaceSecretToken: UserWalletPrivateSpaceToken) => {
      const {privateSpaceTokens} = (voxxrinUserTokensWallet.value?.secretTokens.privateSpaceTokens || [])
          .concat(toVoxxrinUserWalletPrivateSpaceToken(privateSpaceSecretToken))
          .reduce((result, privateSpaceToken) => {
            const spaceTokens = privateSpaceToken.spaceTokens.filter(spaceToken => {
              if(result.alreadyRegisteredTokens.has(spaceToken.value)) {
                return false;
              }

              result.alreadyRegisteredTokens.add(spaceToken.value);
              return spaceToken;
            })

            if(spaceTokens.length) {
              result.privateSpaceTokens.push(privateSpaceToken);
            }

            return result;
          }, { privateSpaceTokens: [] as PrivateSpaceToken[], alreadyRegisteredTokens: new Set<string>() })

      writeTokensWalletInStore({
        secretTokens: {
          eventOrganizerTokens: (voxxrinUserTokensWallet.value?.secretTokens.eventOrganizerTokens || []),
          talkFeedbacksViewerTokens: (voxxrinUserTokensWallet.value?.secretTokens.talkFeedbacksViewerTokens || []),
          privateSpaceTokens,
        }
      });
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
        registerPrivateSpaceSecretToken,
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
