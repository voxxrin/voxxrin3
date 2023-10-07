import * as functions from "firebase-functions";
import {extractSingleQueryParam, logPerf, roundedAverage, sendResponseMessage} from "../utils";
import {
    checkEventLastUpdate,
    eventTalkStatsFor
} from "../../firestore/firestore-utils";
import {match, P} from "ts-pattern";
import {
    getTalksDetailsWithRatings
} from "../../firestore/services/talk-utils";
import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {ISOLocalDate} from "../../../../../../shared/type-utils";
import {getFamilyEventsStatsToken} from "../../firestore/services/publicTokens-utils";
import {sortBy} from "lodash";

const publicEventStats = functions.https.onRequest(async (request, response) => {

    const eventId = extractSingleQueryParam(request, 'eventId');
    const publicToken = extractSingleQueryParam(request, 'publicToken');

    if(!eventId) { return sendResponseMessage(response, 400, `Missing [eventId] query parameter !`) }
    if(!publicToken) { return sendResponseMessage(response, 400, `Missing [publicToken] query parameter !`) }

    const [eventDescriptor, familyEventsStatsToken] = await logPerf("eventDescriptor and familyEventsStatsToken retrieval", async () => {
         return await Promise.all([
            getEventDescriptor(eventId),
            getFamilyEventsStatsToken(publicToken),
        ]);
    })

    if(!eventDescriptor.eventFamily || !familyEventsStatsToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
        return sendResponseMessage(response, 400, `Provided family events stats token doesn't match with event ${eventId} family: [${eventDescriptor.eventFamily}]`)
    }

    const { cachedHash, updatesDetected } = await logPerf("cached hash", async () => {
        return await checkEventLastUpdate(eventId, [
            root => root.favorites,
            root => root.allFeedbacks,
            root => root.talkListUpdated
        ], request, response)
    });

    if(!updatesDetected) {
        return sendResponseMessage(response, 304)
    }

    try {
        const [talkStats, talksDetailsWithRatings] = await logPerf("eventTalkStats + getTalksDetailsWithRatings", () => {
            return Promise.all([
                eventTalkStatsFor(eventId),
                getTalksDetailsWithRatings(eventId),
            ]);
        })

        const {perTalkStats, dailyTalksStats} = await logPerf("Post processing", async () => {
            const perTalkStats = talksDetailsWithRatings.map(talkDetails => ({
                talkId: talkDetails.talk.id,
                talkTitle: talkDetails.talk.title,
                totalFavoritesCount: talkStats.find(ts => ts.id === talkDetails.talk.id)?.totalFavoritesCount || 0
            }))

            type DailyTalksAndRatings = {
                dayId: string,
                date: ISOLocalDate,
                talks: typeof talksDetailsWithRatings
            }
            const dailyTalks = talksDetailsWithRatings.reduce((dailyTalks, talkAndRatings) => {
                let talkLocalDate = talkAndRatings.talk.start.substring(0, "yyyy-mm-dd".length) as ISOLocalDate;
                const day = match(dailyTalks.find(dt => dt.date === talkLocalDate))
                    .with(P.nullish, (_) => {
                        const day: DailyTalksAndRatings = {
                            dayId: eventDescriptor.days.find(d => d.localDate === talkLocalDate)!.id,
                            date: talkLocalDate,
                            talks: []
                        }
                        dailyTalks.push(day);
                        return day;
                    }).otherwise(day => day);

                day.talks.push(talkAndRatings)

                return dailyTalks;
            }, [] as DailyTalksAndRatings[])

            const eventTopRatedTalksConfig = eventDescriptor.features.topRatedTalks || {
                numberOfDailyTopTalksConsidered: 10,
                minimumAverageScoreToBeConsidered: Math.floor((eventDescriptor.features.ratings.scale.labels.length + 1) / 2),
                minimumNumberOfRatingsToBeConsidered: 10
            }

            if(!eventDescriptor.features.ratings.scale.enabled) {
                eventTopRatedTalksConfig.minimumNumberOfRatingsToBeConsidered = Infinity;
            }

            const dailyTalksStats = sortBy(dailyTalks, dt => dt.date)
                .map(dt => {
                    const talksWithValidAverageRating = dt.talks.map(talk => {
                        const nonNullishRatings = talk.ratings
                            .map(r => r['linear-rating'])
                            .filter(v => v !== null && v !== undefined) as number[];

                        return {
                            ...talk.talk,
                            averageRating: (nonNullishRatings.length >= eventTopRatedTalksConfig.minimumNumberOfRatingsToBeConsidered)
                                ? roundedAverage(nonNullishRatings)
                                : undefined,
                            numberOfVotes: nonNullishRatings.length
                        };
                    }).filter(t => t.averageRating !== undefined
                        && (eventTopRatedTalksConfig.minimumAverageScoreToBeConsidered === undefined || t.averageRating >= eventTopRatedTalksConfig.minimumAverageScoreToBeConsidered)
                    );

                    const topTalks = sortBy(talksWithValidAverageRating, t => -t.averageRating!)
                        .filter((talk, index) => index < eventTopRatedTalksConfig.numberOfDailyTopTalksConsidered)
                        .map(talk => ({
                            talkId: talk.id,
                            title: talk.title,
                            speakers: talk.speakers.map(s => ({
                                id: s.id,
                                fullName: s.fullName,
                                companyName: s.companyName,
                                photoUrl: s.photoUrl
                            })),
                            start: talk.start, end: talk.end,
                            format: talk.format.title,
                            language: talk.language,
                            room: talk.room.title, track: talk.track.title,
                            tags: [], // TODO: remove this once we're OK that it's not used by callers
                            averageRating: talk.averageRating,
                            numberOfVotes: talk.numberOfVotes
                        }))

                    return {
                        date: dt.date,
                        dayId: dt.dayId,
                        topTalks
                    }
                });

            return { perTalkStats, dailyTalksStats }
        })

        sendResponseMessage(response, 200, {
            perTalkStats,
            dailyTalksStats
        }, cachedHash?{
            'ETag': cachedHash
        }:{});
    } catch(error) {
        sendResponseMessage(response, 500, ""+error)
    }
});

export default publicEventStats
