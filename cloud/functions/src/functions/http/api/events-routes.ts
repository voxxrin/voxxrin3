import type {Express} from "express";
import * as z from "zod";
import {ISO_DATETIME_PARSER} from "../../../utils/zod-parsers";
import {Routes} from "./routes";
import {
  ensureHasCrawlerFamilyOrEventOrganizerToken,
  ensureHasEventStatsValidToken,
  ensureHasFamilyOrEventOrganizerToken,
  ensureHasRoomStatsContributorValidToken,
} from "./route-access";

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
    }),
    ensureHasRoomStatsContributorValidToken(),
    async (res, path, query, body, eventDescriptor) =>
      (await import("../event/roomStats")).provideRoomStats(res, path, query, body, eventDescriptor));
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
    }),
    ensureHasRoomStatsContributorValidToken(),
    async (res, path, query, body, eventDescriptor) =>
      (await import("../event/roomStats")).provideRoomsStats(res, path, query, body, eventDescriptor));

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
    }),
    ensureHasCrawlerFamilyOrEventOrganizerToken(),
    async (res, path, query, body) =>
      (await import("../event/crawlEvent")).requestEventScheduleRefresh(res, path, query));
  Routes.get(app, '/events/:eventId/talksEditors',
    z.object({
      query: z.object({
        token: z.string().min(10),
        baseUrl: z.string().min(10)
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }),
    ensureHasFamilyOrEventOrganizerToken(),
    async (res, path, query, eventDescriptor, req) =>
      (await import("../event/talksEditors")).eventTalksEditors(res, path, query, req, eventDescriptor));
  Routes.get(app, '/events/:eventId/talks/:talkId/feedbacks',
    z.object({
      query: z.object({
        token: z.string().min(10),
        updatedSince: ISO_DATETIME_PARSER.optional(),
      }),
      path: z.object({
        eventId: z.string().min(3),
        talkId: z.string().min(1),
      })
    }),
    ensureHasFamilyOrEventOrganizerToken(),
    async (res, path, query, eventDescriptor, req) =>
      (await import("../event/talkFeedbacks")).eventTalkFeedbacks(res, path, query, req, eventDescriptor));
  Routes.get(app, '/events/:eventId/topTalks',
    z.object({
      query: z.object({
        token: z.string().min(10),
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }),
    ensureHasEventStatsValidToken(),
    async (res, path, query, eventDescriptor, req) =>
      (await import("../event/topTalks")).eventTopTalks(res, path, query, req, eventDescriptor));
  Routes.get(app, '/events/:eventId/talksStats',
    z.object({
      query: z.object({
        token: z.string().min(10),
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }),
    ensureHasEventStatsValidToken(),
    async (res, path, query, eventDescriptor, req) =>
      (await import("../event/talksStats")).eventTalksStats(res, path, query, req, eventDescriptor));

  // For statistical needs, such as getting number of daily feedbacks
  Routes.get(app, '/events/:eventId/dailyRatings/stats',
    z.object({
      query: z.object({
        token: z.string().min(10)
      }),
      path: z.object({
        eventId: z.string().min(3),
      })
    }),
    ensureHasFamilyOrEventOrganizerToken(),
    async (res, path, query, eventDescriptor, req) =>
      (await import("../event/dailyRatingsStats")).provideDailyRatingsStats(res, path, query, req));
}
