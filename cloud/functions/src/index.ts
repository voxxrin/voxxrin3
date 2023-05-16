import crawl from "./functions/http/crawl"
import hello from "./functions/http/hello"
import {onUserTalksNoteCreate, onUserTalksNoteUpdate} from "./functions/firestore/onUserTalkNotes"

exports.helloWorld = hello
exports.crawl = crawl
exports.onUserTalksNoteCreate = onUserTalksNoteCreate
exports.onUserTalksNoteUpdate = onUserTalksNoteUpdate