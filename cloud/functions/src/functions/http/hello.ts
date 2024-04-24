import * as functions from "firebase-functions";
import {sendResponseMessage} from "./utils";
import {Response} from "express";

export async function sayHello(response: Response, pathParams: {}, queryParams: {who?: string}) {
  functions.logger.info("Hello voxxrin logs!", {structuredData: true});
  return sendResponseMessage(response, 200, `Hello ${queryParams.who || "nobody"} from Voxxrin!`);
};
