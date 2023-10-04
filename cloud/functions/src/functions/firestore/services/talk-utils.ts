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
    // FIXME: move this to conference descriptor at some point
    const devoxxOverflowTalkIds: Record<string, string[]> = eventId === 'dvbe23' ? {
        "67956": ["72002", "72003", "72004"],
        "67953": ["72007", "72006", "72005"],
        "70101": ["72009", "72008", "72010"],
    }: {}

    const talkIdByOverflowTalkId = Object.entries(devoxxOverflowTalkIds).reduce((talkIdByOverflowTalkId, [talkId, overflowTalkIds]) => {
        overflowTalkIds.forEach(overflowTalkId => talkIdByOverflowTalkId[overflowTalkId] = talkId);
        return talkIdByOverflowTalkId;
    }, {} as Record<string, string>)

    const dailyRatingsColl = await db.collection(`/events/${eventId}/organizer-space/${organizerSpaceToken}/daily-ratings`).listDocuments()

    const allDailyRatings: PerTalkPublicUserIdFeedbackRating[][] = await Promise.all(dailyRatingsColl.map(async dailyRatingsDoc => {
        const dailyPerTalkIdRatings = (await dailyRatingsDoc.get()).data() as DailyTalkFeedbackRatings;

        Object.entries(talkIdByOverflowTalkId).forEach(([overflowTalkId, aliasedTalkId]) => {
            if(dailyPerTalkIdRatings[overflowTalkId]) {
                // Merging overflow talk id ratings into aliased talk id ratings
                dailyPerTalkIdRatings[aliasedTalkId] = {
                    ...(dailyPerTalkIdRatings[aliasedTalkId] || {}),
                    ...dailyPerTalkIdRatings[overflowTalkId]
                }
                delete dailyPerTalkIdRatings[overflowTalkId];
            }
        })

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

        return talks.map(talk => ({
            talk,
            ratings: everyRatings.ratingsForTalk(talk.id)
        }))
    })
}
