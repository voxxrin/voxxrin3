import {db} from "../../../firebase";
import {FIREBASE_CRAWLER_DESCRIPTOR_PARSER} from "../../../crawlers/crawler-parsers";
import {firestore} from "firebase-admin";
import {CollectionReference, Query} from "firebase-admin/firestore";


function zodParseCrawlerSnapshot(snap: firestore.QueryDocumentSnapshot) {
  return {
    ...FIREBASE_CRAWLER_DESCRIPTOR_PARSER.parse(snap.data()), id: snap.id
  }
}

async function getRawCrawlersMatching(collectionFilter: (collection: CollectionReference) => Query) {
  return (
    await collectionFilter(
      db.collection('crawlers')
    ).get()
  ).docs;
}

export async function getCrawlersMatching(collectionFilter: (collection: CollectionReference) => Query) {
  return (await getRawCrawlersMatching(collectionFilter)).map(snap => zodParseCrawlerSnapshot(snap))
}

export async function getAllCrawlers() {
  return getCrawlersMatching(collection => collection);
}

export async function getAllRawCrawlers() {
  return getRawCrawlersMatching(collection => collection);
}
