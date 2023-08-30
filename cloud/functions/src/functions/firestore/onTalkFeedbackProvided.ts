import * as functions from "firebase-functions";
import {UserDailyFeedbacks, UserFeedback} from "../../../../../shared/feedbacks.firestore";
import {db} from "../../firebase";
import {eventLastUpdateRefreshed, getSecretTokenDoc} from "./firestore-utils";
import {ConferenceOrganizerSpace} from "../../../../../shared/conference-organizer-space.firestore";
import {TalkAttendeeFeedback} from "../../../../../shared/talk-feedbacks.firestore";
import {UserTokensWallet} from "../../../../../shared/user-tokens-wallet.firestore";


export const onTalkFeedbackUpdated = functions.firestore
    .document(`users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`)
    .onUpdate(async (change, context) => {
        const eventId = context.params.eventId;
        const userId = context.params.userId;

        const feedbacksBefore = change.before.data() as UserDailyFeedbacks;
        const feedbacksAfter = change.after.data() as UserDailyFeedbacks;

        const lastModificationTimestampBefore = Math.max(...feedbacksBefore.feedbacks.map(f => Date.parse(f.lastUpdatedOn)));
        const feedbacksModifiedAfter = feedbacksAfter.feedbacks.filter(f => Date.parse(f.lastUpdatedOn) > lastModificationTimestampBefore);

        await updateTalkFeedbacksFromUserFeedbacks(userId, eventId, feedbacksModifiedAfter);
    })

export const onTalkFeedbackCreated = functions.firestore
    .document(`users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`)
    .onCreate(async (snapshot, context) => {
        const eventId = context.params.eventId;
        const userId = context.params.userId;

        const userDailyFeedbacks = snapshot.data() as UserDailyFeedbacks

        await updateTalkFeedbacksFromUserFeedbacks(userId, eventId, userDailyFeedbacks.feedbacks);
    })

async function updateTalkFeedbacksFromUserFeedbacks(userId: string, eventId: string, userFeedbacks: UserFeedback[]) {
    const organizerSpace: ConferenceOrganizerSpace = await getSecretTokenDoc(`events/${eventId}/organizer-space`);
    await Promise.all(userFeedbacks.map(async feedback => {
        if(feedback.status === 'provided') {
            const talkFeedbackViewerToken = organizerSpace.talkFeedbackViewerTokens
                .find(tfvt => tfvt.eventId === eventId && tfvt.talkId === feedback.talkId);

            if(!talkFeedbackViewerToken) {
                throw new Error(`No organizer talk token found for eventId=${eventId}, talkId=${feedback.talkId}`);
            }

            const userTokensWallet = (await db.doc(`users/${userId}/tokens-wallet/self`).get()).data() as UserTokensWallet|undefined;
            if(!userTokensWallet) {
                throw new Error(`Unexpected unexistant user token wallet for userId=${userId}`);
            }

            const attendeeFeedback: TalkAttendeeFeedback = {
                talkId: feedback.talkId,
                comment: feedback.comment,
                createdOn: feedback.createdOn,
                lastUpdatedOn: feedback.lastUpdatedOn,
                ratings: feedback.ratings,
                attendeePublicToken: userTokensWallet.publicUserToken
            }

            await Promise.all([
                db.doc(`events/${eventId}/talks/${feedback.talkId}/feedbacks-access/${talkFeedbackViewerToken.secretToken}/feedbacks/${userTokensWallet.publicUserToken}`).set(attendeeFeedback),
                eventLastUpdateRefreshed(eventId, [ "feedbacks" ])
            ])
        }
    }))
}
