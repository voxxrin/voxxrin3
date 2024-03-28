import {ISODatetime} from "./type-utils";

export type TalkStats = {
  id: string,
  totalFavoritesCount: number
}

export type RoomStats = {
  id: string;
  capacityFillingRatio: number,
  recordedAt: ISODatetime,
  persistedAt: ISODatetime,
  valid: {
    forTalkId: string,
    until: ISODatetime
  }
}
