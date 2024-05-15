import * as express from 'express';
import * as functions from 'firebase-functions';
import {declareExpressHttpRoutes} from "./functions/http/api/routes";

const app = express()
app.use(express.json());
app.use((req, res, next) => {
  if (req.headers['x-forwarded-host'] && req.headers['x-forwarded-host'].toString().endsWith("voxxr.in") && req.originalUrl.startsWith('/api')) {
    req.url = req.originalUrl.substring("/api".length);
  }
  next();
})

// For organizers
// TODO: remove me once devoxx cfp will no longer use legacy URL
//  replaced by POST /api/events/:eventId/refreshScheduleRequest (requires event/family organizer token)
exports.crawl = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecated_crawl")).crawl(request, response)
})
// TODO: remove me once devoxx cfp will no longer use legacy URL
//  replaced by GET /api/events/:eventId/talksEditors (requires event/family organizer token)
exports.talkFeedbacksViewers = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedTalkFeedbacksViewers")).legacyTalkFeedbacksViewers(request, response)
})
// For organizers + co organizers (in same event family)
// TODO: remove me once devoxx cfp will no longer use legacy URL
//  replaced by GET /api/events/:eventId/talks/:talkId/feedbacks (requires event/family organizer token)
//    beware, this is now a single-talk endpoint (simplifies ETag caching a lot)
//    beware, ETag support has been re-added to the new endpoint
exports.attendeesFeedbacks = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedAttendeesFeedbacks")).legacyAttendeesFeedbacks(request, response)
})
// TODO: remove me once devoxx CFP + TweetWall project will no longer use legacy URL
//  replaced by GET /api/events/:eventId/topTalks (requires event/family organizer token OR event/family event stats access token)
//    beware, root node renamed from dailyTalksStats to dailyTopTalks
// +replaced by GET /api/events/:eventId/talksStats (requires event/family organizer token OR event/family event stats access token)
exports.publicEventStats = functions.https.onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedPublicEventStats")).legacyPublicEventStats(request, response)
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
exports.onUserTokenWalletDeleted = functions.firestore
  .document(`users/{userId}/tokens-wallet/self`)
  .onDelete(async (change, context) => {
    (await import('./functions/firestore/onUserTokensWalletDeleted')).onUserTokensWalletDeleted(change, context)
  })
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
