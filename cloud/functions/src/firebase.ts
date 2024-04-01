import {logger} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const LOG_CONTEXT: {context: Record<string, any>|undefined } = {
  context: undefined
}

export async function exposeLogContext(context: Record<string, any>|undefined, callback: () => Promise<void>) {
  const initialContext = LOG_CONTEXT.context;
  LOG_CONTEXT.context = context;
  try {
    await callback();
  } finally {
    LOG_CONTEXT.context = initialContext;
  }
}

export const debug = function(msg:string) {
    logger.debug(msg, {structuredData: true, ...LOG_CONTEXT.context})
}

export const info = function(msg:string) {
    logger.info(msg, {structuredData: true, ...LOG_CONTEXT.context})
}

export const error = function(msg:string) {
    logger.error(msg, {structuredData: true, ...LOG_CONTEXT.context})
}

initializeApp();

export const db = getFirestore();
