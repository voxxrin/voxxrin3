import {ISODatetime} from "../../../../../../shared/type-utils";
import {RoomsStats} from "../../../../../../shared/event-stats";
import {db, error} from "../../../firebase";
import {getTimeslottedTalks} from "./schedule-utils";
import {toValidFirebaseKey} from "../../../../../../shared/utilities/firebase.utils";


export async function ensureRoomsStatsFilledFor(eventId: string) {
  const roomsStatsDoc = db.doc(`events/${eventId}/roomsStats-allInOne/self`)

  const roomsStats = await roomsStatsDoc.get()

  if(!roomsStats.exists) {
    const timeslottedTalks = await getTimeslottedTalks(eventId)

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
