import {SimpleTalk, YoutubeVideo} from "../src/functions/firestore/services/talk-utils";

export type TalkMatchingYoutubeTestData = {
  youtubeVideos: YoutubeVideo[],
  talks: SimpleTalk[],
  expectedMappedTalks: Array<{ talkId: string, videoId: string, __talkTitle: string, __videoTitle: string }>,
  expectedUnmappedTalks: Array<{ talkId: string, __talkTitle: string }>
}
