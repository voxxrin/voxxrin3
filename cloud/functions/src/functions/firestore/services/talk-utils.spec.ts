import {describe, expect, it} from "vitest";
import {findYoutubeMatchingTalks, SimpleTalk, YoutubeVideo} from "./talk-utils";
import {TalkMatchingYoutubeTestData} from "../../../../test-data/test-data";
import {VDBUH2024_TALKS_AND_YOUTUBE} from "../../../../test-data/vdbuh2024-talks-and-youtube";
import {DVBE23_TALKS_AND_YOUTUBE} from "../../../../test-data/dvbe23-talks-and-youtube";


describe('findYoutubeMatchingTalks', () => {
  [
    { name: 'dvbe23', testingData: DVBE23_TALKS_AND_YOUTUBE },
    { name: 'vdbuh2024', testingData: VDBUH2024_TALKS_AND_YOUTUBE }
  ].forEach((testDescriptor: { name: string, testingData: TalkMatchingYoutubeTestData}) => {
    it(`${testDescriptor.name} shouldn't have same youtube video assigned twice`, () => {
      const talksByVideo = testDescriptor.testingData.expectedMappedTalks.reduce((talksByVideo, mappedTalk) => {
        const key = `${mappedTalk['__videoTitle']} (videoId=${mappedTalk.videoId})`;
        talksByVideo.set(key, (talksByVideo.get(key) || []).concat(mappedTalk))
        return talksByVideo
      }, new Map<string, TalkMatchingYoutubeTestData['expectedMappedTalks']>());

      const videosHavingMultipleMappings = Array.from(
        talksByVideo.entries()
      ).filter(([videoTitle, mappings]) => mappings.length !== 1)
       .map(([videoTitle, mappings]) => ({ videoTitle, mappings }));

      expect(videosHavingMultipleMappings.length,
        `Duplicated youtube video mappings entries detected:\n${videosHavingMultipleMappings.map(videoHavingMultipleMappings => {
        return `Video: ${videoHavingMultipleMappings.videoTitle}]: \n${videoHavingMultipleMappings.mappings.map(mapping => `  ${mapping.__talkTitle} (talkId=${mapping.talkId})`).join("\n")}`
      }).join("\n")}`).toStrictEqual(0)

    })
    it(`${testDescriptor.name} expected youtube matching talks`, () => {
      const result = findYoutubeMatchingTalks(testDescriptor.testingData.talks, testDescriptor.testingData.youtubeVideos)

      const unmappedTalks = result.unmatchedTalks.map(gm => gm.id).sort()
      const expectedUnmappedTalks = testDescriptor.testingData.expectedUnmappedTalks.map(ut => ut.talkId).sort();

      expect(unmappedTalks).toStrictEqual(expectedUnmappedTalks)

      const mappedTalks = result.matchedTalks
        .map(gm => `${gm.talk.id} -> ${gm.video.id}`)
        .sort();

      const expectedMappedTalks = testDescriptor.testingData.expectedMappedTalks
        .map(mt => `${mt.talkId} -> ${mt.videoId}`)
        .sort()

      expect(mappedTalks).toStrictEqual(expectedMappedTalks)
    })

  })
})
