import {describe} from 'vitest'
import {OPENPLANNER_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe('openplanenr crawlers', () => {
    const events = [
      {
        id: 'tw24', confName: `Tech & Wine 2024`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/735f935f7b082f6cd304dcadd5940b8b/raw/tech-and-wine.json`
      }, {
        id: 'sunnytech24', confName: `Sunny Tech '24`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/2b4cb4f3ee1f2861cfe2ebb434dc6c20/raw/sunnytech.json`
      }, {
        id: 'snowcamp25', confName: `Snowcamp '25`,
        descriptorUrl: `https://gist.githubusercontent.com/schassande/83afc84a6d6bb78ebed9b77399ebf8b6/raw/voxxrin-snowcamp-2025.json`
      }
    ];

    createCrawlingTestsFor(events, OPENPLANNER_CRAWLER);
})
