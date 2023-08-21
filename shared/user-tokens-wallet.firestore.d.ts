import {TalkFeedbacksViewerSecretToken} from "./conference-organizer-space.firestore";
import {ISODatetime} from "./type-utils";

export type UserTokensWallet = {
    privateUserId: string;
    publicUserToken: string;
    secretTokens: {
        eventOrganizerTokens: EventOrganizerSecretToken[],
        talkFeedbacksViewerTokens: TalkFeedbacksViewerSecretToken[],
        firebaseMessagingTokens: FirebaseMessagingToken[],
    }
}

export type EventOrganizerSecretToken = {
    secretToken: string;
    eventId: string;
}

export type FirebaseMessagingToken = {
    platform: "web"|"android"|"ios";
    secretToken: string;
    registeredOn: ISODatetime;
}
