import * as functions from "firebase-functions";
import {Response} from "firebase-functions";
import * as z from "zod";
import {RouteParameters} from "express-serve-static-core";
import * as express from "express";
import {AnyZodObject} from "zod";
import { type Express, NextFunction} from "express";

export function extractSingleQueryParam(request: functions.https.Request, paramName: string) {
    const value  = request.query[paramName];
    return Array.isArray(value)?value[0]?.toString():value?.toString();
}

export function extractMultiQueryParam(request: functions.https.Request, paramName: string): string[] {
    const value  = request.query[paramName];
    return (Array.isArray(value)?value.map(v => v.toString()):[ value?.toString() ].filter(v => !!v)) as string[];
}

export function sendResponseMessage(response: Response, httpCode: number, message?: string|undefined|object, headers?: Record<string,string>) {
    response.status(httpCode)
    if(headers) {
        Object.entries(headers).forEach(([key, value]) => {
            response.setHeader(key, value);
        })
    }

    if(message) {
        if(typeof message !== 'string') {
            response.setHeader("Content-Type", "application/json")
        }
        response.send(message)
    } else {
        response.send();
    }

    return;
}

export function roundedAverage(values: number[]) {
    return Math.round(values.reduce((sum, v) => sum+v, 0) * 100 / values.length) / 100;
}

export async function logPerf<T>(message: string, callback: () => Promise<T>) {
    const start = Date.now();

    console.log(`START: ${message}`)
    const results = await callback()
    console.log(`END: ${message} -- Elapsed: ${Date.now()-start}ms`)

    return results;
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
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, body: BODY) => void) {
    app.post(route, validateRouteWith(schema), (req, res) => {
      callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS, req.body as BODY)
    })
  },
  put: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestWithBodyZodObject,
    QUERY_PARAMS = z.infer<VALIDATION_SCHEMA>['query'],
    BODY = z.infer<VALIDATION_SCHEMA>['body'],
    PATH_PARAMS = Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path']
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS, body: BODY) => void) {
    app.put(route, validateRouteWith(schema), (req, res) => {
      callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS, req.body as BODY)
    })
  },
  get: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestZodObject,
    QUERY_PARAMS = z.infer<VALIDATION_SCHEMA>['query'],
    PATH_PARAMS = Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path']
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS) => void) {
    app.get(route, validateRouteWith(schema), (req, res) => {
      callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS)
    })
  },
  delete: function<
    ROUTE extends string,
    VALIDATION_SCHEMA extends RequestZodObject,
    QUERY_PARAMS = z.infer<VALIDATION_SCHEMA>['query'],
    PATH_PARAMS = Omit< RouteParameters<ROUTE>, keyof z.infer<VALIDATION_SCHEMA>['path']> & z.infer<VALIDATION_SCHEMA>['path']
  >(app: Express, route: ROUTE, schema: VALIDATION_SCHEMA, callback: (res: express.Response, pathParams: PATH_PARAMS, queryParams: QUERY_PARAMS) => void) {
    app.delete(route, validateRouteWith(schema), (req, res) => {
      callback(res, req.params as PATH_PARAMS, req.query as QUERY_PARAMS)
    })
  }
}

