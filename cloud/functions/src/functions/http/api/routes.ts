import {Routes} from "../utils";
import * as z from "zod";
import type {Express} from 'express';
import {declareEventHttpRoutes} from "./events-routes";
import {declareAdminHttpRoutes} from "./admin-routes";

export function declareExpressHttpRoutes(app: Express) {
  // For testing purposes only
  Routes.get(app, `/helloWorld`, z.object({ query: z.object({ who: z.string().optional() })}),
    async (res, path, query) =>
      (await import("../hello")).sayHello(res, path, query));

  declareEventHttpRoutes(app);
  declareAdminHttpRoutes(app);
}
