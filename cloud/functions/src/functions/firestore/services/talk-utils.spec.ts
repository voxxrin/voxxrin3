import {describe, expect, it} from "vitest";
import {findYoutubeMatchingTalks, SimpleTalk, YoutubeVideo} from "./talk-utils";
import {DVBE23_TALKS_AND_YOUTUBE} from "../../../../test-data/dvbe23-talks-and-youtube";


describe('findYoutubeMatchingTalks', () => {
  it(`dvbe23 talks`, () => {
    const result = findYoutubeMatchingTalks(DVBE23_TALKS_AND_YOUTUBE.talks, DVBE23_TALKS_AND_YOUTUBE.youtubeVideos)

    const unmappedTalks = result.unmatchedTalks.map(gm => gm.id).sort()
    const expectedUnmappedTalks = DVBE23_TALKS_AND_YOUTUBE.expectedUnmappedTalks.map(ut => ut.talkId).sort();

    expect(unmappedTalks).toStrictEqual(expectedUnmappedTalks)

    const mappedTalks = result.matchedTalks
      .map(gm => `${gm.talk.id} -> ${gm.video.id}`)
      .sort();

    const expectedMappedTalks = DVBE23_TALKS_AND_YOUTUBE.expectedMappedTalks
      .map(mt => `${mt.talkId} -> ${mt.videoId}`)
      .sort()

    expect(mappedTalks).toStrictEqual(expectedMappedTalks)
  })
})
