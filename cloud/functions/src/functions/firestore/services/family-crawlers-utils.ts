import {CollectionReference, Query} from "firebase-admin/firestore";
import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import {FIREBASE_FAMILY_CRAWLER_PARSER} from "../../../family-crawlers/family-crawler-parsers";

async function getRawFamilyCrawlersMatching(collectionFilter: (collection: CollectionReference) => Query) {
  return (
    await collectionFilter(
      db.collection('family-crawlers')
    ).get()
  ).docs;
}

export async function getFamilyCrawlersMatching(collectionFilter: (collection: CollectionReference) => Query) {
  return (await getRawFamilyCrawlersMatching(collectionFilter)).map((snap: firestore.QueryDocumentSnapshot) => FIREBASE_FAMILY_CRAWLER_PARSER.parse(snap.data()));
}
