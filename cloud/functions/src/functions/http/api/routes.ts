import * as z from "zod";
import {Express, NextFunction} from 'express';
import {declareEventHttpRoutes} from "./events-routes";
import {declareAdminHttpRoutes} from "./admin-routes";
import {AnyZodObject} from "zod";
import * as express from "express";
import {RouteParameters} from "express-serve-static-core";
import {debug, exposeLogContext} from "../../../firebase";
import {sendResponseMessage} from "../utils";
import {publicEndpoint} from "./route-access";

export function declareExpressHttpRoutes(app: Express) {
  // For testing purposes only
  Routes.get(app, `/helloWorld`,
    z.object({ query: z.object({ who: z.string().optional() })}),
    publicEndpoint(),
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


function specialParamHandling<T extends string>(params: any) {
  // Put here some special query/path param transformation that would need to be applied
  // on a general level
}


export const Routes = {
  post: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestWithBodyZodObject,
    QUERY_PARAMS extends z.infer<VALIDATION_SCHEMA>['query'],
    BODY extends z.infer<VALIDATION_SCHEMA>['body'],
    PATH_PARAMS extends Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path'],
    ACCESS_GUARD extends (pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS) => Promise<_>,
    _,
    ACCESS_GUARD_RETURNTYPE = Awaited<ReturnType<ACCESS_GUARD>>,
  >(
    app: Express,
    route: ROUTE,
    schema: VALIDATION_SCHEMA,
    accessGuard: ACCESS_GUARD,
    callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, body: BODY, accessGuardResult: ACCESS_GUARD_RETURNTYPE, req: express.Request) => void
  ) {
    app.post(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'POST', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`POST ${route} [${stringifiedPathParams}]`)

        const pathParams = req.params as PATH_PARAMS;
        specialParamHandling(pathParams);
        const queryParams = req.query as QUERY_PARAMS;
        specialParamHandling(queryParams)
        const body = req.body as BODY;

        try {
          const accessGuardResult = await accessGuard(pathParams, queryParams) as ACCESS_GUARD_RETURNTYPE;
          try {
            await callback(res, pathParams, queryParams, body, accessGuardResult, req)
          } catch(e) {
            return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
          }
        } catch(e) {
          return sendResponseMessage(res, 403, `Forbidden: ${e?.toString()}`)
        }
      })
    })
  },
  put: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestWithBodyZodObject,
    QUERY_PARAMS extends z.infer<VALIDATION_SCHEMA>['query'],
    BODY extends z.infer<VALIDATION_SCHEMA>['body'],
    PATH_PARAMS extends Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path'],
    ACCESS_GUARD extends (pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS) => Promise<_>,
    _,
    ACCESS_GUARD_RETURNTYPE = Awaited<ReturnType<ACCESS_GUARD>>,
  >(
    app: Express,
    route: ROUTE,
    schema: VALIDATION_SCHEMA,
    accessGuard: ACCESS_GUARD,
    callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, body: BODY, accessGuardResult: ACCESS_GUARD_RETURNTYPE, req: express.Request) => void
  ) {
    app.put(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'PUT', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`PUT ${route} [${stringifiedPathParams}]`)

        const pathParams = req.params as PATH_PARAMS;
        specialParamHandling(pathParams);
        const queryParams = req.query as QUERY_PARAMS;
        specialParamHandling(queryParams)
        const body = req.body as BODY;

        try {
          const accessGuardResult = await accessGuard(pathParams, queryParams) as ACCESS_GUARD_RETURNTYPE;
          try {
            await callback(res, pathParams, queryParams, body, accessGuardResult, req)
          } catch(e) {
            return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
          }
        } catch(e) {
          return sendResponseMessage(res, 403, `Forbidden: ${e?.toString()}`)
        }
      })
    })
  },
  get: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestWithBodyZodObject,
    QUERY_PARAMS extends z.infer<VALIDATION_SCHEMA>['query'],
    PATH_PARAMS extends Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path'],
    ACCESS_GUARD extends (pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS) => Promise<_>,
    _,
    ACCESS_GUARD_RETURNTYPE = Awaited<ReturnType<ACCESS_GUARD>>,
  >(
    app: Express,
    route: ROUTE,
    schema: VALIDATION_SCHEMA,
    accessGuard: ACCESS_GUARD,
    callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, accessGuardResult: ACCESS_GUARD_RETURNTYPE, req: express.Request) => void
  ) {
    app.get(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'GET', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`GET ${route} [${stringifiedPathParams}]`)

        const pathParams = req.params as PATH_PARAMS;
        specialParamHandling(pathParams);
        const queryParams = req.query as QUERY_PARAMS;
        specialParamHandling(queryParams)

        try {
          const accessGuardResult = await accessGuard(pathParams, queryParams) as ACCESS_GUARD_RETURNTYPE;
          try {
            await callback(res, pathParams, queryParams, accessGuardResult, req);
          } catch(e) {
            return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
          }
        } catch(e) {
          return sendResponseMessage(res, 403, `Forbidden: ${e?.toString()}`)
        }
      })
    })
  },
  delete: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestWithBodyZodObject,
    QUERY_PARAMS extends z.infer<VALIDATION_SCHEMA>['query'],
    PATH_PARAMS extends Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path'],
    ACCESS_GUARD extends (pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS) => Promise<_>,
    _,
    ACCESS_GUARD_RETURNTYPE = Awaited<ReturnType<ACCESS_GUARD>>,
  >(
    app: Express,
    route: ROUTE,
    schema: VALIDATION_SCHEMA,
    accessGuard: ACCESS_GUARD,
    callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, accessGuardResult: ACCESS_GUARD_RETURNTYPE, req: express.Request) => void
  ) {
    app.delete(route, validateRouteWith(schema), (req, res) => {
      const stringifiedPathParams = stringifyParams(req.params)
      const stringifiedQueryParams = stringifyParams(req.query as Record<string, string>)
      exposeLogContext({ method: 'DELETE', route, pathParams: stringifiedPathParams, queryParams: stringifiedQueryParams }, async () => {
        debug(`DELETE ${route} [${stringifiedPathParams}]`)

        const pathParams = req.params as PATH_PARAMS;
        specialParamHandling(pathParams);
        const queryParams = req.query as QUERY_PARAMS;
        specialParamHandling(queryParams)

        try {
          const accessGuardResult = await accessGuard(pathParams, queryParams) as ACCESS_GUARD_RETURNTYPE;
          try {
            await callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS, accessGuardResult, req);
          } catch(e) {
            return sendResponseMessage(res, 500, `Unexpected Error: ${e?.toString()}`)
          }
        } catch(e) {
          return sendResponseMessage(res, 403, `Forbidden: ${e?.toString()}`)
        }
      })
    })
  }
}

function stringifyParams(params: Record<string, string>) {
  return Object.entries(params).map(([key,value]) => `${key}=${value}`).join(", ")
}
