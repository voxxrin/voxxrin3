import crawl from "./functions/http/crawl"
import hello from "./functions/http/hello"
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

// For testing purposes only
exports.helloWorld = hello

// For organizers
exports.crawl = crawl
exports.talkFeedbacksViewers = talkFeedbacksViewers
// For organizers + co organizers (in same event family)
exports.attendeesFeedbacks = attendeesFeedbacks
exports.eventStats = deprecatedEventStats

// Admin only
exports.migrateFirestoreSchema = migrateFirestoreSchema

exports.onUserTalksNoteCreate = onUserTalksNoteCreate
exports.onUserTalksNoteUpdate = onUserTalksNoteUpdate
exports.onUserCreated = onUserCreated
exports.onTalkFeedbackUpdated = onTalkFeedbackUpdated
exports.onTalkFeedbackCreated = onTalkFeedbackCreated
