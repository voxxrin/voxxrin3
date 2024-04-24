import type {Express} from "express";
import {Routes} from "../utils";
import * as z from "zod";
import {ISO_DATETIME_PARSER} from "../../../utils/zod-parsers";

export function declareEventHttpRoutes(app: Express) {
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
    }), async (res, path, query, body) =>
      (await import("../event/roomStats")).provideRoomStats(res, path, query, body));
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
    }), async (res, path, query, body) =>
      (await import("../event/roomStats")).provideRoomsStats(res, path, query, body));

  // For conf organizers
  Routes.post(app, '/events/:eventId/refreshScheduleRequest',
    z.object({
      query: z.object({
        token: z.string().min(10),
        dayIds: z.string().min(1).optional()
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }), async (res, path, query, body) =>
      (await import("../event/crawlEvent")).requestEventScheduleRefresh(res, path, query));

  // For statistical needs, such as getting number of daily feedbacks
  Routes.get(app, '/events/:eventId/dailyRatings/stats',
    z.object({
      query: z.object({
        token: z.string().min(10)
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }), async (res, path, query) =>
      (await import("../event/dailyRatingsStats")).provideDailyRatingsStats(res, path, query));
}
