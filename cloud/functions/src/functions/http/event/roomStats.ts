import {sendResponseMessage} from "../utils";
import {Response} from "express";
import {ISODatetime} from "@shared/type-utils";
import {getTimeslottedTalks, TimeslottedTalk} from "../../firestore/services/schedule-utils";
import {RoomsStats, RoomStats} from "@shared/event-stats";
import {db} from "../../../firebase";

import {toValidFirebaseKey} from "@shared/utilities/firebase.utils";
import {TALK_COMPLETION_THRESHOLD} from "@shared/constants/shared-constants.utils";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {resolvedEventFirestorePath} from "@shared/utilities/event-utils";


export async function provideRoomsStats(response: Response, pathParams: {eventId: string, spaceToken?: string|undefined}, queryParams: {token: string}, body: {
  roomsStats: Array<{
    roomId: string,
    capacityFillingRatio: number,
    recordedAt: ISODatetime,
  }>
}, eventDescriptor: ConferenceDescriptor) {

  const {eventId, spaceToken} = pathParams;
  const timeslottedTalks = await getTimeslottedTalks(spaceToken, eventId)

  await Promise.all(body.roomsStats.map(async (bodyRoomStats) => {
    const roomStats = await updateRoomStatsFor({
      timeslottedTalks,
      spaceToken,
      eventId: eventId,
      ...bodyRoomStats
    })

    return roomStats;
  }));

  const firebaseRoomsStats = (await db.doc(`${resolvedEventFirestorePath(eventId, spaceToken)}/roomsStats-allInOne/self`).get()).data() as RoomsStats

  sendResponseMessage(response, 200, {
    roomsStats: firebaseRoomsStats
  });
}

export async function provideRoomStats(response: Response, pathParams: {spaceToken?: string|undefined, eventId: string, roomId: string}, queryParams: {token: string}, body: {
  capacityFillingRatio: number,
  recordedAt: ISODatetime,
}, eventDescriptor: ConferenceDescriptor) {

  const {eventId, spaceToken} = pathParams;
  const timeslottedTalks = await getTimeslottedTalks(spaceToken, eventId)
  const roomStats = await updateRoomStatsFor({
    timeslottedTalks,
    spaceToken,
    eventId,
    roomId: pathParams.roomId,
    capacityFillingRatio: body.capacityFillingRatio,
    recordedAt: body.recordedAt
  })

  sendResponseMessage(response, 200, {
    roomStats
  });
}

async function updateRoomStatsFor(params: { spaceToken: string|undefined, eventId: string, timeslottedTalks: TimeslottedTalk[], roomId: string, capacityFillingRatio: number, recordedAt: ISODatetime}): Promise<RoomStats> {
  const recordingTimestamp = Date.parse(params.recordedAt)

  const talkCandidates = params.timeslottedTalks
    .filter(tt => {
      return tt.room.id === params.roomId
        && recordingTimestamp <= maxTalkCompletionTimestampToBeConsideredACandidateForCapacityFillingRatio(tt)
        && recordingTimestamp + 3*60*60*1000 > Date.parse(tt.start)
    }).sort((tt1, tt2) => Date.parse(tt1.start) - Date.parse(tt2.start));

  // Picking the first upcoming candidate
  const nextTalkCandidate: TimeslottedTalk|undefined = talkCandidates[0];

  const roomStats: RoomStats = {
    roomId: params.roomId,
    recordedAt: params.recordedAt,
    persistedAt: new Date().toISOString() as ISODatetime,
    ...(nextTalkCandidate ? {
      capacityFillingRatio: params.capacityFillingRatio,
      valid: {
        forTalkId: nextTalkCandidate.id,
        until: new Date(maxTalkCompletionTimestampToBeConsideredACandidateForCapacityFillingRatio(nextTalkCandidate)).toISOString() as ISODatetime
      }
    } : {
      capacityFillingRatio: 'unknown'
    })
  }

  await db.doc(`${resolvedEventFirestorePath(params.eventId, params.spaceToken)}/roomsStats-allInOne/self`).update(toValidFirebaseKey(params.roomId), roomStats);

  return roomStats;
}

function maxTalkCompletionTimestampToBeConsideredACandidateForCapacityFillingRatio(talk: TimeslottedTalk) {
  const startTimestamp = Date.parse(talk.start)
  const talkDuration = Date.parse(talk.end) - startTimestamp
  return (startTimestamp + (TALK_COMPLETION_THRESHOLD * talkDuration))
}
