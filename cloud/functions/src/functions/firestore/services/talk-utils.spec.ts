import {describe, expect, it} from "vitest";
import {findYoutubeMatchingTalks, SimpleTalk, YoutubeVideo} from "./talk-utils";
import {TalkMatchingYoutubeTestData} from "../../../../test-data/test-data";
import {VDBUH2024_TALKS_AND_YOUTUBE} from "../../../../test-data/vdbuh2024-talks-and-youtube";
import {DVBE23_TALKS_AND_YOUTUBE} from "../../../../test-data/dvbe23-talks-and-youtube";
import {VDZ24_TALKS_AND_YOUTUBE} from "../../../../test-data/vdz24-talks-and-youtube";
import {VDCERN24_TALKS_AND_YOUTUBE} from "../../../../test-data/vdcern24-talks-and-youtube";
import {VDCLUJ23_TALKS_AND_YOUTUBE} from "../../../../test-data/vdcluj23-talks-and-youtube";
import {VDLOA24_TALKS_AND_YOUTUBE} from "../../../../test-data/vdloa24-talks-and-youtube";
import {VDT24_TALKS_AND_YOUTUBE} from "../../../../test-data/vdt24-talks-and-youtube";
import {VDTHESS23_TALKS_AND_YOUTUBE} from "../../../../test-data/vdthess23-talks-and-youtube";


describe('findYoutubeMatchingTalks', () => {
  ([
    { name: 'dvbe23', testingData: DVBE23_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: undefined },
    { name: 'vdbuh2024', testingData: VDBUH2024_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: ["[VDBUH2024]"],  },
    { name: 'vdz24', testingData: VDZ24_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: [],  },
    { name: 'vdcern24', testingData: VDCERN24_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: [],  },
    { name: 'vdcluj23', testingData: VDCLUJ23_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: [],  },
    { name: 'vdloa24', testingData: VDLOA24_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: "Voxxed Days Ioannina 2024".split(" "),  },
    { name: 'vdt24', testingData: VDT24_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: [],  },
    { name: 'vdthess23', testingData: VDTHESS23_TALKS_AND_YOUTUBE, excludeTitleWordsFromMatching: "Voxxed Days Thessaloniki 2023".split(" "),  },
  ]).forEach((testDescriptor: { name: string, testingData: TalkMatchingYoutubeTestData, excludeTitleWordsFromMatching: string[]|undefined }) => {
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
      const result = findYoutubeMatchingTalks(testDescriptor.testingData.talks, testDescriptor.testingData.youtubeVideos, {
        platform: 'youtube',
        youtubeHandle: 'devoxx',
        excludeTitleWordsFromMatching: testDescriptor.excludeTitleWordsFromMatching
      })

      const unmappedTalks = result.unmatchedTalks.map(gm => gm.talk.id).sort()
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
