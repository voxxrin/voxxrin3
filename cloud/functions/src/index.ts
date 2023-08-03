import crawl from "./functions/http/crawl"
import hello from "./functions/http/hello"
import {migrateFirestoreSchema} from "./functions/http/migrateFirestoreSchema";
import {onUserTalksNoteCreate, onUserTalksNoteUpdate} from "./functions/firestore/onUserTalkNotes"

exports.helloWorld = hello
exports.crawl = crawl
exports.migrateFirestoreSchema = migrateFirestoreSchema

exports.onUserTalksNoteCreate = onUserTalksNoteCreate
exports.onUserTalksNoteUpdate = onUserTalksNoteUpdate