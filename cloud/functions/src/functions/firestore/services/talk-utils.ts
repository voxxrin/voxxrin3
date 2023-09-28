import {db} from "../../../firebase";
import {DetailedTalk} from "../../../../../../shared/daily-schedule.firestore";
import {getSecretTokenRef} from "../firestore-utils";
import {
    PerPublicUserIdFeedbackRatings
} from "../../../../../../shared/conference-organizer-space.firestore";


export async function getTalkDetails(eventId: string) {
    const talkRefs = await db
        .collection("events").doc(eventId)
        .collection("talks")
        .listDocuments();

    const talks  = await Promise.all(talkRefs.map(async talkRef => (await talkRef.get()).data() as DetailedTalk))

    return talks;
}

type PerTalkPublicUserIdFeedbackRating = {
    talkId: string,
    perPublicUserIdRatings: PerPublicUserIdFeedbackRatings,
}

class ConfOrganizerAllRatingsModel {
    constructor(private allRatings: PerTalkPublicUserIdFeedbackRating[]) {}

    ratingsForTalk(talkId: string) {
        const talkFeedbacks = this.allRatings
            .find(rating => rating.talkId === talkId)

        if(!talkFeedbacks) {
            return [];
        }

        return Object.keys(talkFeedbacks.perPublicUserIdRatings).map(publicUserId => ({
            publicUserId,
            ...talkFeedbacks.perPublicUserIdRatings[publicUserId]
        }));
    }

    userRating(talkId: string, publicUserId: string) {
        const talkFeedbacks = this.ratingsForTalk(talkId);
        return talkFeedbacks?.find(ratings => ratings.publicUserId === publicUserId) || undefined
    }
}

export async function getEveryRatingsForEvent(eventId: string) {
    const organizerSpaceRef = await getSecretTokenRef(`/events/${eventId}/organizer-space`)
    const eventAllRatings: PerTalkPublicUserIdFeedbackRating[] = await Promise.all(
        (await organizerSpaceRef.collection('ratings').listDocuments() || [])
            .map(talkRatingRef => talkRatingRef.get().then(doc => ({ talkId: talkRatingRef.id, perPublicUserIdRatings: doc.data() as PerPublicUserIdFeedbackRatings })))
    );

    return new ConfOrganizerAllRatingsModel(eventAllRatings);
}

export async function getTalksDetailsWithRatings(eventId: string) {
    const talks = await getTalkDetails(eventId);
    const everyRatings = await getEveryRatingsForEvent(eventId);
    return talks.map(talk => ({
        talk,
        ratings: everyRatings.ratingsForTalk(talk.id)
    }))
}
