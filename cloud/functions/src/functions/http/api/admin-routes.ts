import type {Express} from "express";
import {sendResponseMessage} from "../utils";
import * as z from "zod";
import {Routes} from "./routes";
import {ensureHasSuperAdminToken} from "./route-access";
import {httpCallAll} from "../../firestore/migrations/024-fillEmptyUserSubCollectionDocs";

export function declareAdminHttpRoutes(app: Express) {

  Routes.post(app, `/cron/refreshSlowPacedTalkStatsForOngoingEvents`,
    z.object({
      query: z.object({ token: z.string() })
    }),
    ensureHasSuperAdminToken(),
    async (res, path, query, body) => {
      const results = (await import("../../../cron/slowPacedTalkStatsRefresh")).refreshSlowPacedTalkStatsForOngoingEvents();
      return sendResponseMessage(res, 200, {
        message: `slow-paced talkStats have been properly refreshed !`,
        results
      })
    })

  Routes.post(app, `/cron/cleanOutdatedUsers`,
    z.object({
      query: z.object({ token: z.string() })
    }),
    ensureHasSuperAdminToken(),
    async (res, path, query, body) => {
      const results = await (await import("../../firestore/services/user-utils")).cleanOutdatedUsers();
      return sendResponseMessage(res, 200, {
        message: `${results.totalDeletedUsers} users have been deleted (in ${results.totalDuration}ms) !`,
        results
      })
    })

  Routes.post(app, `/admin/fillEmptyUserSubCollectionDocs`,
    z.object({
      query: z.object({
        token: z.string(),
        fromUserId: z.string().optional(),
        toUserId: z.string().optional(),
      })
    }),
    ensureHasSuperAdminToken(),
    async (res, path, { fromUserId, toUserId }, body) => {
      const results = await (await import("../../firestore/migrations/024-fillEmptyUserSubCollectionDocs")).configurableFillEmptyUserSubCollectionDocs({
        fromUserId, toUserId,
      });
      return sendResponseMessage(res, 200, {
        message: `${results.stats.successes} users have been deleted (in ${results.stats.totalDuration}ms) !`,
        results
      })
    })
  Routes.post(app, `/admin/fillShardedEmptyUserSubCollectionDocs`,
    z.object({
      query: z.object({
        token: z.string(),
        baseUrl: z.string(),
      })
    }),
    ensureHasSuperAdminToken(),
    async (res, path, { token, baseUrl }, body) => {
      const results = await (await import("../../firestore/migrations/024-fillEmptyUserSubCollectionDocs")).httpCallAll({
        baseUrl, token,
      });
      return sendResponseMessage(res, 200, {
        results
      })
    })

  Routes.get(app, `/admin/globalStats`,
    z.object({
      query: z.object({ token: z.string() })
    }),
    ensureHasSuperAdminToken(),
    async (res, path, query, body) => {
      const results = await (await import("../event/globalStatistics")).globalStats();
      return sendResponseMessage(res, 200, results);
    })
}
