import {
    ProvidedUserFeedback,
    UserDailyFeedbacks,
    UserFeedback
} from "../../../../../shared/feedbacks.firestore";
import {db} from "../../firebase";
import {eventLastUpdateRefreshed, getSecretTokenDoc, getSecretTokenRef} from "./firestore-utils";
import {ConferenceOrganizerSpace} from "../../../../../shared/conference-organizer-space.firestore";
import {TalkAttendeeFeedback} from "../../../../../shared/talk-feedbacks.firestore";
import {EventLastUpdates} from "../../../../../shared/event-list.firestore";
import {ISODatetime} from "../../../../../shared/type-utils";
import {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import {Change} from "firebase-functions/lib/common/change";
import {QueryDocumentSnapshot} from "firebase-functions/lib/v2/providers/firestore";
import {User} from "../../../../../shared/user.firestore";
import {FirestoreEvent} from "firebase-functions/lib/v2/providers/firestore";


export const onTalkFeedbackUpdated = async (event: FirestoreEvent<Change<QueryDocumentSnapshot>|undefined, { userId: string, eventId: string, dayId: string }>) => {
    const eventId = event.params.eventId;
    const userId = event.params.userId;
    const dayId = event.params.dayId;

    if(!event.data) {
      return;
    }

    const feedbacksBefore = event.data.before.data() as UserDailyFeedbacks;
    const feedbacksAfter = event.data.after.data() as UserDailyFeedbacks;

    const lastModificationTimestampBefore = Math.max(...feedbacksBefore.feedbacks.map(f => Date.parse(f.lastUpdatedOn)));
    const feedbacksModifiedAfter = feedbacksAfter.feedbacks.filter(f => Date.parse(f.lastUpdatedOn) > lastModificationTimestampBefore);

    await updateTalkFeedbacksFromUserFeedbacks(userId, eventId, dayId, feedbacksModifiedAfter, ['lastUpdatedOn']);
}

export const onTalkFeedbackCreated = async (event: FirestoreEvent<QueryDocumentSnapshot|undefined, { userId: string, eventId: string, dayId: string }>) => {
    const eventId = event.params.eventId;
    const userId = event.params.userId;
    const dayId = event.params.dayId;

    if(!event.data) {
      return;
    }

    const userDailyFeedbacks = event.data.data() as UserDailyFeedbacks

    await updateTalkFeedbacksFromUserFeedbacks(userId, eventId, dayId, userDailyFeedbacks.feedbacks, ['createdOn', 'lastUpdatedOn']);
}

function enforceBetween(value: number|null, min: number, max: number) {
    if(value === null) {
        return null;
    }

    return Math.min(Math.max(min, value), max);
}

function enforceValueIncludedInto<T>(value: T|null, possibleValues: T[]) {
    if(value === null) {
        return null;
    }

    if(possibleValues.includes(value)) {
        return value;
    }

    return null;
}

function enforceValuesIncludedInto<T>(values: T[]|null, possibleValues: T[]) {
    if(values === null) {
        return [];
    }

    return values.filter(value => enforceValueIncludedInto(value, possibleValues) !== null);
}

async function updateTalkFeedbacksFromUserFeedbacks(userId: string, eventId: string, dayId: string, userFeedbacks: UserFeedback[], enforceTimestampOnFields: Array<'lastUpdatedOn'|'createdOn'>) {
    const organizerSpaceRef = await getSecretTokenRef(`events/${eventId}/organizer-space`);
    const organizerSpace = (await organizerSpaceRef.get()).data() as ConferenceOrganizerSpace;

    const confDescriptor: ConferenceDescriptor = (await db.doc(`events/${eventId}/event-descriptor/self`).get()).data() as ConferenceDescriptor;
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

            const user = (await db.doc(`users/${userId}`).get()).data() as User|undefined;
            if(!user) {
                throw new Error(`Unexpected unexistant user for userId=${userId}`);
            }

            // Ensuring ratings values are valid values compared to conf descriptor's ratings
            // This is important to check this because user-level ratings content can't be enforced (see important note above)
            // and we need to enforce ratings at talk & organizer-space levels are consistent
            const enforcedRatings: ProvidedUserFeedback['ratings'] = {
                "linear-rating": enforceBetween(feedback.ratings["linear-rating"], 1, confDescriptor.features.ratings.scale.labels.length),
                "custom-rating": enforceValueIncludedInto(feedback.ratings["custom-rating"], confDescriptor.features.ratings["custom-scale"].choices.map(choice => choice.id)),
                bingo: enforceValuesIncludedInto(feedback.ratings.bingo, confDescriptor.features.ratings.bingo.choices.map(choice => choice.id)),
            }

            const attendeeFeedback: TalkAttendeeFeedback = {
                talkId: feedback.talkId,
                comment: feedback.comment,
                createdOn: enforceTimestampOnFields.includes("createdOn")?new Date().toISOString() as ISODatetime : existingDBFeedback.createdOn,
                lastUpdatedOn: enforceTimestampOnFields.includes("lastUpdatedOn")?new Date().toISOString() as ISODatetime : existingDBFeedback.lastUpdatedOn,
                ratings: enforcedRatings,
                attendeePublicToken: user.publicUserToken
            }

            await Promise.all([
                db.doc(`events/${eventId}/talks/${feedback.talkId}/feedbacks-access/${talkFeedbackViewerToken.secretToken}/feedbacks/${user.publicUserToken}`).set(attendeeFeedback),
                db.doc(`events/${eventId}/organizer-space/${organizerSpace.organizerSecretToken}/ratings/${feedback.talkId}`).update(`${user.publicUserToken}`, enforcedRatings),
                db.doc(`events/${eventId}/organizer-space/${organizerSpace.organizerSecretToken}/daily-ratings/${dayId}`)
                    .update(`${feedback.talkId}.${user.publicUserToken}`, enforcedRatings),
                eventLastUpdateRefreshed(eventId, [ "allFeedbacks" ]),
                eventLastUpdateRefreshed(eventId, [ feedback.talkId ], rootNode => {
                    const feedbacks = {} as NonNullable<EventLastUpdates['feedbacks']>;
                    rootNode.feedbacks = feedbacks;
                    return { pathPrefix: "feedbacks.", parentNode: feedbacks };
                }),
            ])
        }
    }))
}
