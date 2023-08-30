import * as functions from "firebase-functions";
import {Response} from "firebase-functions";

export function extractSingleQueryParam(request: functions.https.Request, paramName: string) {
    const value  = request.query[paramName];
    return Array.isArray(value)?value[0]?.toString():value?.toString();
}

export function extractMultiQueryParam(request: functions.https.Request, paramName: string): string[] {
    const value  = request.query[paramName];
    return (Array.isArray(value)?value.map(v => v.toString()):[ value?.toString() ].filter(v => !!v)) as string[];
}

export function sendResponseMessage(response: Response, httpCode: number, message?: string|undefined, headers?: Record<string,string>) {
    response.status(httpCode)
    if(headers) {
        Object.entries(headers).forEach(([key, value]) => {
            response.setHeader(key, value);
        })
    }

    if(message) {
        response.send(message)
    } else {
        response.send();
    }

    return;
}
