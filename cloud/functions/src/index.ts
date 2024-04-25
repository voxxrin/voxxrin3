import * as express from 'express';
import * as functions from 'firebase-functions';
import {declareExpressHttpRoutes} from "./functions/http/api/routes";

const app = express()
app.use(express.json());

// Legacy HTTP Endpoints declaration... please use declareRoutes() instead !

// For organizers
// TODO: remove me once devoxx cfp will no longer use legacy URL
exports.crawl = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecated_crawl")).crawl(request, response)
})
// TODO: remove me once devoxx cfp will no longer use legacy URL
exports.talkFeedbacksViewers = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedTalkFeedbacksViewers")).legacyTalkFeedbacksViewers(request, response)
})
// For organizers + co organizers (in same event family)
// TODO: remove me once devoxx cfp will no longer use legacy URL
exports.attendeesFeedbacks = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/attendeesFeedbacks")).attendeesFeedbacks(request, response)
})
// TODO: remove me once devoxx CFP + TweetWall project will no longer use legacy URL
exports.publicEventStats = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/publicEventStats")).legacyPublicEventStats(request, response)
})

// Deprecated (wait for Devoxx BE 23 end to safely remove it)
exports.eventStats = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedEventStats")).deprecatedEventStats(request, response)
})

// Admin only
exports.migrateFirestoreSchema = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/migrateFirestoreSchema")).migrateFirestoreSchema(request, response)
})
exports.globalStats = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/globalStatistics")).globalStats(request, response)
})

// Express handler
declareExpressHttpRoutes(app)
exports.api = functions.https.onRequest(app);

// Firebase handlers
exports.onUserTalksNoteCreate = functions.firestore
  .document("users/{userId}/events/{eventId}/talksNotes/{talkId}")
  .onCreate(async (change, context) => {
    (await import('./functions/firestore/onUserTalkNotes')).onUserTalksNoteCreate(change, context)
  });
exports.onUserTalksNoteUpdate = functions.firestore
  .document("users/{userId}/events/{eventId}/talksNotes/{talkId}")
  .onUpdate(async (change, context) => {
    (await import('./functions/firestore/onUserTalkNotes')).onUserTalksNoteUpdate(change, context)
  });
exports.onUserCreated = functions.auth.user().onCreate(async (user, context) => {
  (await import('./functions/firestore/onUserCreated')).onUserCreated(user, context)
});
exports.onTalkFeedbackUpdated = functions.firestore
  .document(`users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`)
  .onUpdate(async (change, context) => {
    (await import('./functions/firestore/onTalkFeedbackProvided')).onTalkFeedbackUpdated(change, context)
  });
exports.onTalkFeedbackCreated = functions.firestore
  .document(`users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`)
  .onCreate(async (snapshot, context) => {
    (await import('./functions/firestore/onTalkFeedbackProvided')).onTalkFeedbackCreated(snapshot, context)
  });

// Schedulers
exports.refreshSlowPacedTalkStatsCron = functions.pubsub
  .schedule("*/10 5-20 * * *").timeZone("Europe/Paris")
  .onRun(async (event) => {

    (await import('./cron/slowPacedTalkStatsRefresh')).refreshSlowPacedTalkStatsForOngoingEvents()
});
