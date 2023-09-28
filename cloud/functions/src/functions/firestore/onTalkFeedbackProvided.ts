import * as functions from "firebase-functions";
import {UserDailyFeedbacks, UserFeedback} from "../../../../../shared/feedbacks.firestore";
import {db} from "../../firebase";
import {eventLastUpdateRefreshed, getSecretTokenDoc, getSecretTokenRef} from "./firestore-utils";
import {ConferenceOrganizerSpace} from "../../../../../shared/conference-organizer-space.firestore";
import {TalkAttendeeFeedback} from "../../../../../shared/talk-feedbacks.firestore";
import {UserTokensWallet} from "../../../../../shared/user-tokens-wallet.firestore";
import {EventLastUpdates} from "../../../../../shared/event-list.firestore";
import {ISODatetime} from "../../../../../shared/type-utils";


export const onTalkFeedbackUpdated = functions.firestore
    .document(`users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`)
    .onUpdate(async (change, context) => {
        const eventId = context.params.eventId;
        const userId = context.params.userId;
        const dayId = context.params.dayId;

        const feedbacksBefore = change.before.data() as UserDailyFeedbacks;
        const feedbacksAfter = change.after.data() as UserDailyFeedbacks;

        const lastModificationTimestampBefore = Math.max(...feedbacksBefore.feedbacks.map(f => Date.parse(f.lastUpdatedOn)));
        const feedbacksModifiedAfter = feedbacksAfter.feedbacks.filter(f => Date.parse(f.lastUpdatedOn) > lastModificationTimestampBefore);

        await updateTalkFeedbacksFromUserFeedbacks(userId, eventId, dayId, feedbacksModifiedAfter, ['lastUpdatedOn']);
    })

export const onTalkFeedbackCreated = functions.firestore
    .document(`users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`)
    .onCreate(async (snapshot, context) => {
        const eventId = context.params.eventId;
        const userId = context.params.userId;
        const dayId = context.params.dayId;

        const userDailyFeedbacks = snapshot.data() as UserDailyFeedbacks

        await updateTalkFeedbacksFromUserFeedbacks(userId, eventId, dayId, userDailyFeedbacks.feedbacks, ['createdOn', 'lastUpdatedOn']);
    })

async function updateTalkFeedbacksFromUserFeedbacks(userId: string, eventId: string, dayId: string, userFeedbacks: UserFeedback[], enforceTimestampOnFields: Array<'lastUpdatedOn'|'createdOn'>) {
    const organizerSpaceRef = await getSecretTokenRef(`events/${eventId}/organizer-space`);
    const organizerSpace = (await organizerSpaceRef.get()).data() as ConferenceOrganizerSpace;

    const dbFeedbacks = (await db.doc(`users/${userId}/events/${eventId}/days/${dayId}/feedbacks/self`).get()).data() as UserDailyFeedbacks;
    await Promise.all(userFeedbacks.map(async feedback => {
        const existingDBFeedback = dbFeedbacks.feedbacks.find(dbFeedback => dbFeedback.timeslotId === feedback.timeslotId);

        if(!existingDBFeedback) {
            console.warn(`No feedback found for userId=${userId}, eventId=${eventId}, dayId=${dayId}, timeslotId=${feedback.timeslotId} => skipping !`)
            return;
        }

        // Important note: We're not updating `users/${userId}/events/${eventId}/days/${dayId}/feedbacks/self` document's
        // createdOn / lastUpdatedOn based on enforceTimestampOnFields on purpose
        // If we would do it, it would trigger onTalkFeedbackUpdated() without, leading to an infinite update loop

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
                createdOn: enforceTimestampOnFields.includes("createdOn")?new Date().toISOString() as ISODatetime : existingDBFeedback.createdOn,
                lastUpdatedOn: enforceTimestampOnFields.includes("lastUpdatedOn")?new Date().toISOString() as ISODatetime : existingDBFeedback.lastUpdatedOn,
                ratings: feedback.ratings,
                attendeePublicToken: userTokensWallet.publicUserToken
            }

            await Promise.all([
                db.doc(`events/${eventId}/talks/${feedback.talkId}/feedbacks-access/${talkFeedbackViewerToken.secretToken}/feedbacks/${userTokensWallet.publicUserToken}`).set(attendeeFeedback),
                db.doc(`events/${eventId}/organizer-space/${organizerSpace.organizerSecretToken}/ratings/${feedback.talkId}`).update(`${userTokensWallet.publicUserToken}`, feedback.ratings),
                eventLastUpdateRefreshed(eventId, [ "allFeedbacks" ]),
                eventLastUpdateRefreshed(eventId, [ feedback.talkId ], rootNode => {
                    const feedbacks = {} as EventLastUpdates['feedbacks'];
                    rootNode.feedbacks = feedbacks;
                    return { pathPrefix: "feedbacks.", parentNode: feedbacks };
                }),
            ])
        }
    }))
}
