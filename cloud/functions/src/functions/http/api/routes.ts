import * as z from "zod";
import {Express, NextFunction} from 'express';
import {declareEventHttpRoutes} from "./events-routes";
import {declareAdminHttpRoutes} from "./admin-routes";
import {AnyZodObject} from "zod";
import * as express from "express";
import {RouteParameters} from "express-serve-static-core";
import {debug, exposeLogContext} from "../../../firebase";
import {sendResponseMessage} from "../utils";

export function declareExpressHttpRoutes(app: Express) {
  // For testing purposes only
  Routes.get(app, `/helloWorld`, z.object({ query: z.object({ who: z.string().optional() })}),
    async (res, path, query) =>
      (await import("../hello")).sayHello(res, path, query));

  declareEventHttpRoutes(app);
  declareAdminHttpRoutes(app);
}


type RequestZodObject = z.ZodObject<{
  query?: AnyZodObject,
  path?: AnyZodObject,
}>
type RequestWithBodyZodObject = z.ZodObject<{
  body?: AnyZodObject,
  query?: AnyZodObject,
  path?: AnyZodObject,
}>


const validateRouteWith =
  (schema: z.AnyZodObject) =>
    async (req: express.Request, res: express.Response, next: NextFunction) => {
      try {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          path: req.params,
        });
        return next();
      } catch (error) {
        return res.status(412).json(error);
      }
    };

export const Routes = {
  post: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestWithBodyZodObject,
    QUERY_PARAMS = z.infer<VALIDATION_SCHEMA>['query'],
    BODY = z.infer<VALIDATION_SCHEMA>['body'],
    PATH_PARAMS = Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path']
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, body: BODY, req: express.Request) => void) {
    app.post(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'POST', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`POST ${route} [${stringifiedPathParams}]`)
        try {
          await callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS, req.body as BODY, req)
        } catch(e) {
          return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
        }
      })
    })
  },
  put: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestWithBodyZodObject,
    QUERY_PARAMS = z.infer<VALIDATION_SCHEMA>['query'],
    BODY = z.infer<VALIDATION_SCHEMA>['body'],
    PATH_PARAMS = Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path']
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, body: BODY, req: express.Request) => void) {
    app.put(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'PUT', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`PUT ${route} [${stringifiedPathParams}]`)
        try {
          await callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS, req.body as BODY, req)
        } catch(e) {
          return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
        }
      })
    })
  },
  get: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestZodObject,
    QUERY_PARAMS = z.infer<VALIDATION_SCHEMA>['query'],
    PATH_PARAMS = Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path']
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, req: express.Request) => void) {
    app.get(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'GET', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`GET ${route} [${stringifiedPathParams}]`)
        try {
          await callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS, req);
        } catch(e) {
          return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
        }
      })
    })
  },
  delete: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestZodObject,
    QUERY_PARAMS = z.infer<VALIDATION_SCHEMA>['query'],
    PATH_PARAMS = Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path']
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, req: express.Request) => void) {
    app.delete(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'DELETE', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`DELETE ${route} [${stringifiedPathParams}]`)
        try {
          await callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS, req);
        } catch(e) {
          return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
        }
      })
    })
  }
}

function stringifyParams(params: Record<string, string>) {
  return Object.entries(params).map(([key,value]) => `${key}=${value}`).join(", ")
}
