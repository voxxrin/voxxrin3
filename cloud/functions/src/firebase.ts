import {logger} from "firebase-functions";

export const info = function(msg:string) {
    logger.info(msg, {structuredData: true})
}