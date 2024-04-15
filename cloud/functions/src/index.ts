import crawl from "./functions/http/crawl"
import {migrateFirestoreSchema} from "./functions/http/migrateFirestoreSchema";
import {onUserTalksNoteCreate, onUserTalksNoteUpdate} from "./functions/firestore/onUserTalkNotes"
import {onUserCreated} from "./functions/firestore/onUserCreated";
import {
    onTalkFeedbackCreated,
    onTalkFeedbackUpdated
} from "./functions/firestore/onTalkFeedbackProvided";
import attendeesFeedbacks from "./functions/http/event/attendeesFeedbacks";
import deprecatedEventStats from "./functions/http/event/deprecatedEventStats";
import talkFeedbacksViewers from "./functions/http/event/talkFeedbacksViewers";
import publicEventStats from "./functions/http/event/publicEventStats";
import {globalStats} from "./functions/http/event/globalStatistics";
import * as express from 'express';
import * as functions from 'firebase-functions';
import {declareExpressHttpRoutes} from "./functions/http/routes";
import {refreshSlowPacedTalkStatsForOngoingEvents} from "./cron/slowPacedTalkStatsRefresh";

const app = express()
app.use(express.json());

// Legacy HTTP Endpoints declaration... please use declareRoutes() instead !

// For organizers
exports.crawl = crawl
exports.talkFeedbacksViewers = talkFeedbacksViewers
// For organizers + co organizers (in same event family)
exports.attendeesFeedbacks = attendeesFeedbacks
exports.publicEventStats = publicEventStats

// Deprecated (wait for Devoxx BE end to safely remove it)
exports.eventStats = deprecatedEventStats

// Admin only
exports.migrateFirestoreSchema = migrateFirestoreSchema
exports.globalStats = globalStats

// Express handler
declareExpressHttpRoutes(app)
exports.api = functions.https.onRequest(app);

// Firebase handlers
exports.onUserTalksNoteCreate = onUserTalksNoteCreate
exports.onUserTalksNoteUpdate = onUserTalksNoteUpdate
exports.onUserCreated = onUserCreated
exports.onTalkFeedbackUpdated = onTalkFeedbackUpdated
exports.onTalkFeedbackCreated = onTalkFeedbackCreated

// Schedulers
exports.refreshSlowPacedTalkStatsCron = functions.pubsub
  .schedule("*/10 5-20 * * *").timeZone("Europe/Paris")
  .onRun(async (event) => {

    refreshSlowPacedTalkStatsForOngoingEvents();
});
