import {SimpleTalk, YoutubeVideo} from "../src/functions/firestore/services/talk-utils";
import {Room, TalkFormat} from "../../../shared/daily-schedule.firestore";

export type TalkMatchingYoutubeTestData = {
  youtubeVideos: YoutubeVideo[],
  unmappedYoutubeVideos: YoutubeVideo[],
  talks: Array<SimpleTalk & {format: TalkFormat, room: Room}>,
  expectedMappedTalks: Array<{ talkId: string, videoId: string, __talkTitle: string, __videoTitle: string, __score: number, __speakers: string }>,
  expectedUnmappedTalks: Array<{ talkId: string, __talkTitle: string, __talkSpeakers: string, __talkFormat: string, __talkRoom: string }>
}
