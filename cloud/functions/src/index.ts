import * as express from 'express';
import {declareExpressHttpRoutes} from "./functions/http/api/routes";
import {onDocumentCreated, onDocumentDeleted, onDocumentUpdated} from "firebase-functions/lib/v2/providers/firestore";
import {onSchedule} from "firebase-functions/lib/v2/providers/scheduler";
import {beforeUserCreated} from "firebase-functions/lib/v2/providers/identity";
import {onRequest} from "firebase-functions/lib/v2/providers/https";

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
exports.crawl = onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecated_crawl")).crawl(request, response)
})
// TODO: remove me once devoxx cfp will no longer use legacy URL
//  replaced by GET /api/events/:eventId/talksEditors (requires event/family organizer token)
exports.talkFeedbacksViewers = onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedTalkFeedbacksViewers")).legacyTalkFeedbacksViewers(request, response)
})
// For organizers + co organizers (in same event family)
// TODO: remove me once devoxx cfp will no longer use legacy URL
//  replaced by GET /api/events/:eventId/talks/:talkId/feedbacks (requires event/family organizer token)
//    beware, this is now a single-talk endpoint (simplifies ETag caching a lot)
//    beware, ETag support has been re-added to the new endpoint
exports.attendeesFeedbacks = onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedAttendeesFeedbacks")).legacyAttendeesFeedbacks(request, response)
})
// TODO: remove me once devoxx CFP + TweetWall project will no longer use legacy URL
//  replaced by GET /api/events/:eventId/topTalks (requires event/family organizer token OR event/family event stats access token)
//    beware, root node renamed from dailyTalksStats to dailyTopTalks
// +replaced by GET /api/events/:eventId/talksStats (requires event/family organizer token OR event/family event stats access token)
exports.publicEventStats = onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedPublicEventStats")).legacyPublicEventStats(request, response)
})

// Deprecated (wait for Devoxx BE 23 end to safely remove it)
exports.eventStats = onRequest(async (request, response) => {
  (await import("./functions/http/event/legacy/deprecatedEventStats")).deprecatedEventStats(request, response)
})

// Admin only
exports.migrateFirestoreSchema = onRequest(async (request, response) => {
  (await import("./functions/http/migrateFirestoreSchema")).migrateFirestoreSchema(request, response)
})
exports.globalStats = onRequest(async (request, response) => {
  (await import("./functions/http/event/globalStatistics")).globalStats(request, response)
})

// Express handler
declareExpressHttpRoutes(app)
exports.api = onRequest({}, app);

// Firebase handlers
exports.onUserTalksNoteCreate = onDocumentCreated(
  {document: "users/{userId}/events/{eventId}/talksNotes/{talkId}"},
  async event => (await import('./functions/firestore/onUserTalkNotes')).onUserTalksNoteCreate(event)
)
exports.onUserTalksNoteUpdate = onDocumentUpdated(
  {document: "users/{userId}/events/{eventId}/talksNotes/{talkId}"},
  async event => (await import('./functions/firestore/onUserTalkNotes')).onUserTalksNoteUpdate(event)
)

exports.onUserCreated = beforeUserCreated(
  { },
  async event => (await import('./functions/firestore/onUserCreated')).onUserCreated(event)
)
exports.onUserTokenWalletDeleted = onDocumentDeleted(
  {document: `users/{userId}/tokens-wallet/self`},
  async event => (await import('./functions/firestore/onUserTokensWalletDeleted')).onUserTokensWalletDeleted(event)
)
exports.onTalkFeedbackUpdated = onDocumentUpdated(
  {document: `users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`},
  async event => (await import('./functions/firestore/onTalkFeedbackProvided')).onTalkFeedbackUpdated(event)
)
exports.onTalkFeedbackCreated = onDocumentCreated(
  {document: `users/{userId}/events/{eventId}/days/{dayId}/feedbacks/self`},
  async event => (await import('./functions/firestore/onTalkFeedbackProvided')).onTalkFeedbackCreated(event)
)

// Schedulers
exports.refreshSlowPacedTalkStatsCron = onSchedule(
  {schedule: "*/10 5-20 * * *", timeZone: "Europe/Paris"},
  async event => {
    (await import('./cron/slowPacedTalkStatsRefresh')).refreshSlowPacedTalkStatsForOngoingEvents()
  }
)
