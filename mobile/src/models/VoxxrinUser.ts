import {ValueObject} from "@/models/utils";
import {UserPreferences} from "../../../shared/user-preferences.firestore";
import {EventId} from "@/models/VoxxrinEvent";
import {
  UserWalletEventOrganizerSecretToken,
  UserTokensWallet, UserWalletTalkFeedbacksViewerSecretToken, UserWalletPrivateSpaceToken
} from "../../../shared/user-tokens-wallet.localstorage";
import {TalkId} from "@/models/VoxxrinTalk";
import {Replace} from "../../../shared/type-utils";
import {User} from "../../../shared/user.firestore";


export class UserLocale extends ValueObject<string>{ _userLocaleClassDiscriminator!: never; }

export type VoxxrinUser = Replace<User, {}>

export function toVoxxrinUser(firestoreUser: User): VoxxrinUser {
  return { ...firestoreUser };
}
export function toFirestoreUser(voxxrinUser: VoxxrinUser): User {
  return { ...voxxrinUser };
}

export type VoxxrinUserPreferences = Replace<UserPreferences, {
    pinnedEventIds: Array<EventId>
}>

export type EventOrganizerToken = Replace<UserWalletEventOrganizerSecretToken, {
    eventId: EventId
}>
export type TalkFeedbacksViewerToken = Replace<UserWalletTalkFeedbacksViewerSecretToken, {
    eventId: EventId,
    talkId: TalkId
}>
export type PrivateSpaceToken = Replace<UserWalletPrivateSpaceToken, {
}>

export type VoxxrinUserTokensWallet = Replace<UserTokensWallet, {
    secretTokens: {
        eventOrganizerTokens: EventOrganizerToken[],
        talkFeedbacksViewerTokens: TalkFeedbacksViewerToken[],
        privateSpaceTokens: PrivateSpaceToken[],
    }
}>

export function toVoxxrinUserTokensWallet(rawUserTokensWallet: UserTokensWallet): VoxxrinUserTokensWallet {
  return {
    secretTokens: {
      eventOrganizerTokens: rawUserTokensWallet.secretTokens.eventOrganizerTokens.map(toVoxxrinUserWalletEventOrganizerSecretToken),
      talkFeedbacksViewerTokens: rawUserTokensWallet.secretTokens.talkFeedbacksViewerTokens.map(toVoxxrinUserWalletTalkFeedbacksViewerToken),
      privateSpaceTokens: rawUserTokensWallet.secretTokens.privateSpaceTokens.map(toVoxxrinUserWalletPrivateSpaceToken),
    }
  }
}

export function toVoxxrinUserWalletEventOrganizerSecretToken(raw: UserWalletEventOrganizerSecretToken): EventOrganizerToken {
  return {
    ...raw,
    eventId: new EventId(raw.eventId)
  }
}
export function toVoxxrinUserWalletTalkFeedbacksViewerToken(raw: UserWalletTalkFeedbacksViewerSecretToken): TalkFeedbacksViewerToken {
  return {
    ...raw,
    eventId: new EventId(raw.eventId),
    talkId: new TalkId(raw.talkId),
  }
}
export function toVoxxrinUserWalletPrivateSpaceToken(raw: UserWalletPrivateSpaceToken): PrivateSpaceToken {
  return {
    ...raw,
  }
}

export function toRawUserTokensWallet(voxxrinUserTokensWallet: VoxxrinUserTokensWallet): UserTokensWallet {
  return {
    secretTokens: {
      eventOrganizerTokens: voxxrinUserTokensWallet.secretTokens.eventOrganizerTokens.map(toRawUserWalletEventOrganizerSecretToken),
      talkFeedbacksViewerTokens: voxxrinUserTokensWallet.secretTokens.talkFeedbacksViewerTokens.map(toRawUserWalletTalkFeedbacksViewerSecretToken),
      privateSpaceTokens: voxxrinUserTokensWallet.secretTokens.privateSpaceTokens.map(toRawUserWalletPrivateSpaceToken),
    }
  }
}

export function toRawUserWalletEventOrganizerSecretToken(voxxrin: EventOrganizerToken): UserWalletEventOrganizerSecretToken {
  return {
    ...voxxrin,
    eventId: voxxrin.eventId.value
  }
}

export function toRawUserWalletTalkFeedbacksViewerSecretToken(voxxrin: TalkFeedbacksViewerToken): UserWalletTalkFeedbacksViewerSecretToken {
  return {
    ...voxxrin,
    eventId: voxxrin.eventId.value,
    talkId: voxxrin.talkId.value,
  }
}

export function toRawUserWalletPrivateSpaceToken(voxxrin: PrivateSpaceToken): UserWalletPrivateSpaceToken {
  return {
    ...voxxrin,
  }
}
