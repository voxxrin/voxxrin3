import * as functions from "firebase-functions";
import * as _ from "lodash";

import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {info} from "./firebase"
import {crawl as crawlDevoxx} from "./crawlers/devoxx/crawler"
import {Event} from "./schedule"

initializeApp();

const db = getFirestore();

exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", {structuredData: true});
    response.send("Hello from Firebase!");
});

exports.onUserMessageInfoUpdate = functions.firestore
    .document("users/{userId}/messages/{messageId}")
    .onUpdate((change, context) => {
        const userId = context.params.userId;
        const messageId = context.params.messageId;
        const wasFavorite = change.before.data().favorite;
        const isFavorite = change.after.data().favorite;
        if (wasFavorite != isFavorite) {
            functions.logger.info(
                `favorite update by ${userId} on ${messageId}: ${wasFavorite} => ${isFavorite}`,
                {structuredData: true});

            return db.collection("messages").doc(messageId)
                .update({favoritesCount: FieldValue.increment(isFavorite ? 1 : -1)});
        } else {
            return false;
        }
    });

exports.onUserMessageInfoCreate = functions.firestore
    .document("users/{userId}/messages/{messageId}")
    .onCreate((change, context) => {
        const userId = context.params.userId;
        const messageId = context.params.messageId;
        const isFavorite = change.data().favorite;
        if (isFavorite) {
            functions.logger.info(
                `favorite create by ${userId} on ${messageId}: => ${isFavorite}`,
                {structuredData: true});

            return db.collection("messages").doc(messageId)
                .update({favoritesCount: FieldValue.increment(1)});
        } else {
            return false;
        }
    });


exports.crawl = functions.https.onRequest((request, response) => {
    info("Starting crawling");

    db.collection("events").doc("dvbe22").set({
        id: "dvbe22",
        title: "Devoxx BE 2022",
        start: "2022-10-10",
        end: "2022-10-14",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        // Should fit in a xxx x xxx pixels square
        logo: "https://acme.com/my-conf-logo.png",
        // Should fit in a xxx x xxx pixels rectangle
        backgroundImage: "https://acme.com/background.png",
        location: { city: "Anvers", country: "BE" },
        keywords: [ "Devoxx", "Java", "Kotlin", "Cloud", "Big data", "Web" ],
        mainColor: "#F78125"
      }
    )

    crawlDevoxx("dvbe22").then(
        (event: Event) => {
            saveEvent(event).then(() => {
                info("Crawling done");
                response.send(JSON.stringify(event, null, 2));
            })
        }
    )
});

const saveEvent = async function(event: Event) {
    for (const daySchedule of event.daySchedules) {
        await db.collection("events").doc(event.id)
        .collection("days").doc(daySchedule.day)
            .set(daySchedule)
    }
    for (const talkStat of event.talkStats) {
        // TODO: see if we really want to override stats each time we crawl
        info("saving stats " + talkStat);
        await db.collection("events").doc(event.id)
            .collection("talkStats").doc(talkStat.id)
            .set(talkStat)
    }
}