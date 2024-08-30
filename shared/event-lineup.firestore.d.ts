import {Room, Speaker, TalkAsset, TalkFormat, Track} from "./daily-schedule.firestore";
import type {ISODatetime} from "./type-utils";

export type LineupTalk = {
  id: string,
  title: string,
  format: TalkFormat,
  language: string,
  track: Track,
  tags: string[],
  allocation: {
    room: Room,
    start: ISODatetime,
    end: ISODatetime,
  }|undefined,
}

export type LineupSpeaker = Speaker & {
  talks: LineupTalk[],
}
