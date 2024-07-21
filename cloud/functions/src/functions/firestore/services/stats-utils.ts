import {ISODatetime} from "../../../../../../shared/type-utils";
import {RoomsStats, TalkStats} from "../../../../../../shared/event-stats";
import {db, error} from "../../../firebase";
import {getTimeslottedTalks} from "./schedule-utils";
import {toValidFirebaseKey} from "../../../../../../shared/utilities/firebase.utils";
import {firestore} from "firebase-admin";
import QuerySnapshot = firestore.QuerySnapshot;
import {resolvedEventFirestorePath} from "../../../../../../shared/utilities/event-utils";


export async function ensureRoomsStatsFilledFor(spaceToken: string|undefined, eventId: string) {
  const roomsStatsDoc = db.doc(`${resolvedEventFirestorePath(eventId, spaceToken)}/roomsStats-allInOne/self`)

  const roomsStats = await roomsStatsDoc.get()

  if(!roomsStats.exists) {
    const timeslottedTalks = await getTimeslottedTalks(spaceToken, eventId)

    const roomsStats = timeslottedTalks.reduce((roomsStats, talk) => {
      if(talk.room.id) {
        const encodedRoomId = toValidFirebaseKey(talk.room.id);
        if(!roomsStats[encodedRoomId]) {
          roomsStats[encodedRoomId] = {
            roomId: talk.room.id,
            persistedAt: new Date().toISOString() as ISODatetime,
            recordedAt: new Date().toISOString() as ISODatetime,
            capacityFillingRatio: 'unknown'
          }
        }
      }
      return roomsStats;
    }, {} as RoomsStats);

    try {
      await roomsStatsDoc.set(roomsStats);
    } catch(e) {
      error(`Error while storing event's roomsStats-allInOne entry`)
    }
  }
}

export async function getEventTalkStats(eventId: string, type: 'standard'|'slowPaced' = 'standard') {
  return await db.collection(`events/${eventId}/talksStats${type==='standard'?'':'-slowPaced'}`).get() as QuerySnapshot<TalkStats>;
}

export async function storeEventTalkStats(eventId: string, talkStats: TalkStats[], type: 'standard'|'slowPaced' = 'standard') {
  return Promise.all(talkStats.map(talkStat =>
    db.doc(`events/${eventId}/talksStats${type==='standard'?'':'-slowPaced'}/${talkStat.id}`).set(talkStat)
  ))
}
