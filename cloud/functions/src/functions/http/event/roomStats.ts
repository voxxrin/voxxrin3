import {logPerf, sendResponseMessage} from "../utils";
import {Response} from "express";
import {ISODatetime} from "../../../../../../shared/type-utils";
import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {
  getFamilyRoomStatsContributorToken
} from "../../firestore/services/publicTokens-utils";
import {getTimeslottedTalks, TimeslottedTalk} from "../../firestore/services/schedule-utils";
import {RoomsStats, RoomStats} from "../../../../../../shared/event-stats";
import {db} from "../../../firebase";

import {toValidFirebaseKey} from "../../../../../../shared/utilities/firebase.utils";


export async function provideRoomsStats(response: Response, pathParams: {eventId: string}, queryParams: {token: string}, body: {
  roomsStats: Array<{
    roomId: string,
    capacityFillingRatio: number,
    recordedAt: ISODatetime,
  }>
}) {

  const [eventDescriptor, familyRoomStatsContributorToken] = await logPerf("eventDescriptor and familyRoomStatsContributor retrieval", async () => {
    return await Promise.all([
      getEventDescriptor(pathParams.eventId),
      getFamilyRoomStatsContributorToken(queryParams.token),
    ]);
  })

  if (!eventDescriptor.eventFamily || !familyRoomStatsContributorToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
    return sendResponseMessage(response, 400, `Provided family events stats token doesn't match with event ${pathParams.eventId} family: [${eventDescriptor.eventFamily}]`)
  }

  const timeslottedTalks = await getTimeslottedTalks(pathParams.eventId)

  await Promise.all(body.roomsStats.map(async (bodyRoomStats) => {
    const roomStats = await updateRoomStatsFor({
      timeslottedTalks,
      eventId: pathParams.eventId,
      ...bodyRoomStats
    })

    return roomStats;
  }));

  const firebaseRoomsStats = (await db.doc(`events/${pathParams.eventId}/roomsStats-allInOne/self`).get()).data() as RoomsStats

  sendResponseMessage(response, 200, {
    roomsStats: firebaseRoomsStats
  });
}

export async function provideRoomStats(response: Response, pathParams: {eventId: string, roomId: string}, queryParams: {token: string}, body: {
  capacityFillingRatio: number,
  recordedAt: ISODatetime,
}) {

  const [eventDescriptor, familyRoomStatsContributorToken] = await logPerf("eventDescriptor and familyRoomStatsContributor retrieval", async () => {
    return await Promise.all([
      getEventDescriptor(pathParams.eventId),
      getFamilyRoomStatsContributorToken(queryParams.token),
    ]);
  })

  if(!eventDescriptor.eventFamily || !familyRoomStatsContributorToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
    return sendResponseMessage(response, 400, `Provided family events stats token doesn't match with event ${pathParams.eventId} family: [${eventDescriptor.eventFamily}]`)
  }

  const timeslottedTalks = await getTimeslottedTalks(pathParams.eventId)
  const roomStats = await updateRoomStatsFor({
    timeslottedTalks,
    eventId: pathParams.eventId,
    roomId: pathParams.roomId,
    capacityFillingRatio: body.capacityFillingRatio,
    recordedAt: body.recordedAt
  })

  sendResponseMessage(response, 200, {
    roomStats
  });
}

async function updateRoomStatsFor(params: { eventId: string, timeslottedTalks: TimeslottedTalk[], roomId: string, capacityFillingRatio: number, recordedAt: ISODatetime}): Promise<RoomStats> {
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

  await db.doc(`events/${params.eventId}/roomsStats-allInOne/self`).update(toValidFirebaseKey(params.roomId), roomStats);

  return roomStats;
}

function maxTalkCompletionTimestampToBeConsideredACandidateForCapacityFillingRatio(talk: TimeslottedTalk) {
  // If room capacity is provided after 85% of current talk duration, it means it should
  // be linked to next talk (this can happen when talk ending is earlier than expected)
  const TALK_COMPLETION_THRESHOLD = 0.85

  const startTimestamp = Date.parse(talk.start)
  const talkDuration = Date.parse(talk.end) - startTimestamp
  return (startTimestamp + (TALK_COMPLETION_THRESHOLD * talkDuration))
}
