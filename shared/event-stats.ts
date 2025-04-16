import {ISODatetime} from "./type-utils";

export type TalkStats = {
  id: string,
  totalFavoritesCount: number
}

export type AllInOneTalkStats = Record<string, Omit<TalkStats, "id">>

export type RoomStatsBase = {
  roomId: string;
  recordedAt: ISODatetime,
  persistedAt: ISODatetime,
}

export type UnknownRoomStats = { capacityFillingRatio: 'unknown' }
export type DefinedRoomStats = {
  capacityFillingRatio: number,
  valid: {
    forTalkId: string,
    until: ISODatetime
  }
}

export type RoomStats = RoomStatsBase & (UnknownRoomStats | DefinedRoomStats)

export type RoomsStats = {
  [encodedRoomId: string]: RoomStats
}
