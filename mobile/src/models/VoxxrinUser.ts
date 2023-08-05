import {ValueObject} from "@/models/utils";
import {UserPreferences} from "../../../shared/user-preferences.firestore";
import {Replace} from "@/models/type-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {
    EventOrganizerSecretToken,
    UserTokensWallet
} from "../../../shared/user-tokens-wallet.firestore";
import {TalkFeedbacksViewerSecretToken} from "../../../shared/conference-organizer-space.firestore";
import {TalkId} from "@/models/VoxxrinTalk";


export class UserLocale extends ValueObject<string>{ _userLocaleClassDiscriminator!: never; }

export type VoxxrinUserPreferences = Replace<UserPreferences, {
    pinnedEventIds: Array<EventId>
}>

export type VoxxrinUserTokensWallet = Replace<UserTokensWallet, {
    secretTokens: {
        eventOrganizerTokens: Array<Replace<EventOrganizerSecretToken, {
            eventId: EventId
        }>>,
        talkFeedbacksViewerTokens: Array<Replace<TalkFeedbacksViewerSecretToken, {
            eventId: EventId,
            talkId: TalkId
        }>>
    }
}>
