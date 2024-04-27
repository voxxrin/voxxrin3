import * as functions from "firebase-functions";
import {Response} from "firebase-functions";
import {debug} from "../../firebase";

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

    debug(`START: ${message}`)
    const results = await callback()
    debug(`END: ${message} -- Elapsed: ${Date.now()-start}ms`)

    return results;
}
