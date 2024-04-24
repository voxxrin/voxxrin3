import {ValueObject} from "@/models/utils";
import {UserPreferences} from "../../../shared/user-preferences.firestore";
import {EventId} from "@/models/VoxxrinEvent";
import {
  UserWalletEventOrganizerSecretToken,
  UserTokensWallet, UserWallerTalkFeedbacksViewerSecretToken
} from "../../../shared/user-tokens-wallet.firestore";
import {TalkFeedbacksViewerSecretToken} from "../../../shared/conference-organizer-space.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {Replace} from "../../../shared/type-utils";


export class UserLocale extends ValueObject<string>{ _userLocaleClassDiscriminator!: never; }

export type VoxxrinUserPreferences = Replace<UserPreferences, {
    pinnedEventIds: Array<EventId>
}>

export type EventOrganizerToken = Replace<UserWalletEventOrganizerSecretToken, {
    eventId: EventId
}>
export type TalkFeedbacksViewerToken = Replace<UserWallerTalkFeedbacksViewerSecretToken, {
    eventId: EventId,
    talkId: TalkId
}>

export type VoxxrinUserTokensWallet = Replace<UserTokensWallet, {
    secretTokens: {
        eventOrganizerTokens: EventOrganizerToken[],
        talkFeedbacksViewerTokens: TalkFeedbacksViewerToken[]
    }
}>
