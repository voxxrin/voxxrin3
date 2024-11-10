import {Response, https} from "firebase-functions";
import {debug} from "../../firebase";

export function extractSingleQueryParam(request: https.Request, paramName: string) {
    const value  = request.query[paramName];
    return Array.isArray(value)?value[0]?.toString():value?.toString();
}

export function extractMultiQueryParam(request: https.Request, paramName: string): string[] {
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

export async function durationOf<T>(callback: () => Promise<T>, doAtTheEnd: (result: {durationInMillis: number, result: T }) => void = () => {}): Promise<{durationInMillis: number, result: T }> {
  const start = Date.now();
  const callbackResult = await callback();
  const result = { result: callbackResult, durationInMillis: Date.now()-start };
  doAtTheEnd(result);
  return result;
}
