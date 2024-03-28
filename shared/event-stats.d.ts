import {ISODatetime} from "./type-utils";

export type TalkStats = {
  id: string,
  totalFavoritesCount: number
}

export type RoomStats = {
  roomId: string;
  recordedAt: ISODatetime,
  persistedAt: ISODatetime,
} & ({
  capacityFillingRatio: 'unknown'
} | {
  capacityFillingRatio: number,
  valid: {
    forTalkId: string,
    until: ISODatetime
  }
})

export type RoomsStats = {
  [encodedRoomId: string]: RoomStats
}
