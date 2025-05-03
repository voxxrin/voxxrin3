import {Replace} from "@shared/type-utils";
import {DefinedRoomStats, RoomStats, RoomStatsBase, UnknownRoomStats} from "@shared/event-stats";
import {RoomId} from "@/models/VoxxrinRoom";
import {TalkId} from "@/models/VoxxrinTalk";
import {match} from "ts-pattern";

export type VoxxrinRoomStatsBase = Replace<RoomStatsBase, { roomId: RoomId }>
export type VoxxrinUnknownRoomStats = VoxxrinRoomStatsBase & UnknownRoomStats;
export type VoxxrinDefinedRoomStats = VoxxrinRoomStatsBase & Replace<DefinedRoomStats, {
  valid: Replace<DefinedRoomStats['valid'], {
    forTalkId: TalkId
  }>
}>
export type VoxxrinRoomStats = VoxxrinUnknownRoomStats | VoxxrinDefinedRoomStats;

export function createVoxxrinRoomStatsFromFirestore(firestoreRoomStats: RoomStats): VoxxrinRoomStats {
    return match(firestoreRoomStats)
      .with({ capacityFillingRatio: 'unknown'}, (unknownRoomStats) => ({
        ...unknownRoomStats,
        roomId: new RoomId(unknownRoomStats.roomId)
      })).otherwise(definedRoomStats => ({
        ...definedRoomStats,
        roomId: new RoomId(definedRoomStats.roomId),
        valid: {
          ...definedRoomStats.valid,
          forTalkId: new TalkId(definedRoomStats.valid.forTalkId)
        }
      }))
}
