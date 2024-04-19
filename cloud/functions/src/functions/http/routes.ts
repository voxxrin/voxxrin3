import {Routes, sendResponseMessage} from "./utils";
import {ISO_DATETIME_PARSER} from "../../utils/zod-parsers";
import * as z from "zod";
import type {Express} from 'express';
import {provideRoomsStats, provideRoomStats} from "./event/roomStats";
import helloWorld from "./hello";
import {refreshSlowPacedTalkStatsForOngoingEvents} from "../../cron/slowPacedTalkStatsRefresh";
import {provideDailyRatingsStats} from "./event/dailyRatingsStats";

export function declareExpressHttpRoutes(app: Express) {
// For testing purposes only
  Routes.get(app, `/helloWorld`, z.object({ query: z.object({ who: z.string().optional() })}),
    (res, path, query) => helloWorld(res, path, query));

  // Floxx endpoints
  Routes.post(app, '/events/:eventId/rooms/:roomId/stats',
    z.object({
      body: z.object({
        capacityFillingRatio: z.number().gte(0).lte(1),
        recordedAt: ISO_DATETIME_PARSER
      }),
      query: z.object({
        token: z.string().min(10)
      }),
      path: z.object({
        eventId: z.string().min(3),
        roomId: z.string().min(1)
      })
    }), (res, path, query, body) => provideRoomStats(res, path, query, body));
  Routes.post(app, '/events/:eventId/rooms/stats',
    z.object({
      body: z.object({
        roomsStats: z.array(z.object({
          roomId: z.string().min(1),
          capacityFillingRatio: z.number().gte(0).lte(1),
          recordedAt: ISO_DATETIME_PARSER
        }))
      }),
      query: z.object({
        token: z.string().min(10)
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }), (res, path, query, body) => provideRoomsStats(res, path, query, body)); // ???
  Routes.get(app, '/events/:eventId/dailyRatings/stats',
    z.object({
      query: z.object({
        token: z.string().min(10)
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }), (res, path, query) => provideDailyRatingsStats(res, path, query));

  // refreshSlowPacedTalkStatsForOngoingEvents
  Routes.post(app, `/cron/refreshSlowPacedTalkStatsForOngoingEvents`,
    z.object({
      query: z.object({ token: z.string() })
    }), async (res, path, query, body) => {
      if(process.env.MIGRATION_TOKEN !== query.token) {
        return sendResponseMessage(res, 403, `Forbidden: invalid migrationToken !`)
      }

      const results = await refreshSlowPacedTalkStatsForOngoingEvents();
      return sendResponseMessage(res, 200, {
        message: `slow-paced talkStats have been properly refreshed !`,
        results
      })
    })
}
