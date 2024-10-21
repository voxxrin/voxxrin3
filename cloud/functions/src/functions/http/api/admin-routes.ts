import type {Express} from "express";
import {sendResponseMessage} from "../utils";
import * as z from "zod";
import {Routes} from "./routes";
import {ensureHasSuperAdminToken} from "./route-access";

export function declareAdminHttpRoutes(app: Express) {

  Routes.post(app, `/cron/refreshSlowPacedTalkStatsForOngoingEvents`,
    z.object({
      query: z.object({ token: z.string() })
    }),
    ensureHasSuperAdminToken(),
    async (res, path, query, body) => {
      if(process.env.MIGRATION_TOKEN !== query.token) {
        return sendResponseMessage(res, 403, `Forbidden: invalid migrationToken !`)
      }

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
      if(process.env.MIGRATION_TOKEN !== query.token) {
        return sendResponseMessage(res, 403, `Forbidden: invalid migrationToken !`)
      }

      const results = await (await import("../../firestore/services/user-utils")).cleanOutdatedUsers();
      return sendResponseMessage(res, 200, {
        message: `${results.totalDeletedUsers} users have been deleted (in ${results.totalDurations}ms) !`,
        results
      })
    })

  Routes.get(app, `/admin/globalStats`,
    z.object({
      query: z.object({ token: z.string() })
    }),
    ensureHasSuperAdminToken(),
    async (res, path, query, body) => {
      if(process.env.MIGRATION_TOKEN !== query.token) {
        return sendResponseMessage(res, 403, `Forbidden: invalid migrationToken !`)
      }

      const results = await (await import("../event/globalStatistics")).globalStats();
      return sendResponseMessage(res, 200, results);
    })
}
