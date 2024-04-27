import {db} from "../../../firebase";
import {getSecretTokenRef} from "../firestore-utils";
import {
    DailyTalkFeedbackRatings,
    PerPublicUserIdFeedbackRatings
} from "../../../../../../shared/conference-organizer-space.firestore";
import {logPerf} from "../../http/utils";
import {getTimeslottedTalks} from "./schedule-utils";


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

export async function getEveryRatingsForEvent(eventId: string, organizerSpaceToken: string) {
    const dailyRatingsColl = await db.collection(`/events/${eventId}/organizer-space/${organizerSpaceToken}/daily-ratings`).listDocuments()

    const allDailyRatings: PerTalkPublicUserIdFeedbackRating[][] = await Promise.all(dailyRatingsColl.map(async dailyRatingsDoc => {
        const dailyPerTalkIdRatings = (await dailyRatingsDoc.get()).data() as DailyTalkFeedbackRatings;
        const talkIds = Object.keys(dailyPerTalkIdRatings)
        return talkIds.map(talkId => {
            return {
                talkId,
                perPublicUserIdRatings: dailyPerTalkIdRatings[talkId]
            }
        })
    }))

    return new ConfOrganizerAllRatingsModel(allDailyRatings.flatMap(dailyRatings => dailyRatings));
}

export async function getTalksDetailsWithRatings(eventId: string) {
    return logPerf(`getTalksDetailsWithRatings(${eventId})`, async () => {
        const organizerSpaceRef = await getSecretTokenRef(`/events/${eventId}/organizer-space`)

        const [ talks, everyRatings ] = await Promise.all([
            getTimeslottedTalks(eventId),
            getEveryRatingsForEvent(eventId, organizerSpaceRef.id)
        ]);

        return talks
          .filter(talk => !talk.isOverflow)
          .map(talk => ({
            talk,
            ratings: everyRatings.ratingsForTalk(talk.id)
          }))
    })
}
