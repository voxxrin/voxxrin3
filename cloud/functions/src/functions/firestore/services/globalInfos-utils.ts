import {db} from "../../../firebase";
import {firestore} from "firebase-admin";
import {ISODatetime} from "@shared/type-utils";
import DocumentSnapshot = firestore.DocumentSnapshot;


export type GlobalInfos = {
  previousSlowPacedTalkStatsExecution: ISODatetime
}

export async function getGlobalInfos() {
  return await db.doc(`global-infos/self`).get() as DocumentSnapshot<GlobalInfos>
}

export async function storeGlobalInfos(globalInfos: GlobalInfos) {
  await db.doc(`global-infos/self`).set(globalInfos);
}
