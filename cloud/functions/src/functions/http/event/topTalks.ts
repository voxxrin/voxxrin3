import {Response, Request} from "express";
import {logPerf, roundedAverage, sendResponseMessage} from "../utils";
import {checkEventLastUpdate, eventTalkStatsFor} from "../../firestore/firestore-utils";
import {getTalksDetailsWithRatings} from "../../firestore/services/talk-utils";
import {ISOLocalDate} from "../../../../../../shared/type-utils";
import {match, P} from "ts-pattern";
import {sortBy} from "lodash";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";


export async function eventTopTalks(response: Response, pathParams: {eventId: string}, queryParams: {token: string }, request: Request, eventDescriptor: ConferenceDescriptor) {

  const eventId = pathParams.eventId;
  const { cachedHash, updatesDetected } = await logPerf("cached hash", async () => {
    return await checkEventLastUpdate(eventId, [
      root => root.allFeedbacks,
      root => root.talkListUpdated
    ], request, response)
  });

  if(!updatesDetected) {
    return sendResponseMessage(response, 304)
  }

  try {
    const talksDetailsWithRatings = await logPerf("getTalksDetailsWithRatings", () => getTalksDetailsWithRatings(eventId))

    const { dailyTalksStats} = await logPerf("Post processing", async () => {
      type DailyTalksAndRatings = {
        dayId: string,
        date: ISOLocalDate,
        talks: typeof talksDetailsWithRatings
      }

      const dailyTalks = talksDetailsWithRatings.reduce((dailyTalks, talkAndRatings) => {
        const talkLocalDate = talkAndRatings.talk.start.substring(0, "yyyy-mm-dd".length) as ISOLocalDate;
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

      return { dailyTalksStats }
    })

    sendResponseMessage(response, 200, {
      dailyTopTalks: dailyTalksStats
    }, cachedHash?{
      'ETag': cachedHash
    }:{});
  } catch(error) {
    sendResponseMessage(response, 500, ""+error)
  }
}
