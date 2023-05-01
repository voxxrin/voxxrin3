import {logger} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

export const info = function(msg:string) {
    logger.info(msg, {structuredData: true})
}

initializeApp();

export const db = getFirestore();
