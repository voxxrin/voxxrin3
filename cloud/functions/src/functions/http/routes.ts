import {Routes} from "./utils";
import * as z from "zod";
import type {Express} from 'express';
import helloWorld from "./hello";

export function declareExpressHttpRoutes(app: Express) {
// For testing purposes only
  Routes.get(app, `/helloWorld`, z.object({ query: z.object({ who: z.string().optional() })}), helloWorld);

}
