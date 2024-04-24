import type {Express} from "express";
import {Routes, sendResponseMessage} from "../utils";
import * as z from "zod";

export function declareAdminHttpRoutes(app: Express) {

  Routes.post(app, `/cron/refreshSlowPacedTalkStatsForOngoingEvents`,
    z.object({
      query: z.object({ token: z.string() })
    }), async (res, path, query, body) => {
      if(process.env.MIGRATION_TOKEN !== query.token) {
        return sendResponseMessage(res, 403, `Forbidden: invalid migrationToken !`)
      }

      const results = (await import("../../../cron/slowPacedTalkStatsRefresh")).refreshSlowPacedTalkStatsForOngoingEvents();
      return sendResponseMessage(res, 200, {
        message: `slow-paced talkStats have been properly refreshed !`,
        results
      })
    })
}
