import {describe, it} from 'vitest'
import {OPENPLANNER_CRAWLER, OPENPLANNER_DESCRIPTOR_PARSER} from "./crawler";
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {http} from "../utils";
import {sanityCheckEvent} from "../crawl";

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
    ] as const;

    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await http.get(event.descriptorUrl);
            const descriptor = OPENPLANNER_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await OPENPLANNER_CRAWLER.crawlerImpl(event.id, descriptor, {});
            FULL_EVENT_PARSER.parse(result);

            const errorMessages = sanityCheckEvent(result);
            if(errorMessages.length) {
              throw new Error(`Some sanity checks were encountered: \n${errorMessages.map(msg => `  ${msg}`).join("\n")}`);
            }
        }, { timeout: 300000 })
    })
})
