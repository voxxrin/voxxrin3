import {describe, it} from 'vitest'
import {OPENPLANNER_CRAWLER, OPENPLANNER_DESCRIPTOR_PARSER} from "./crawler";
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {http} from "../utils";

describe('openplanenr crawlers', () => {
    const events = [
      {
        // id: 'tw24', confName: `Tech & Wine 2024`,
        // descriptorUrl: `todo`
      // }, {
        id: 'sunnytech24', confName: `Sunny Tech '24`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/64ad7b14d77cc0c85bb4d60a6913a022/raw/sunnytech.json`
      }
    ] as const;

    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await http.get(event.descriptorUrl);
            const descriptor = OPENPLANNER_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await OPENPLANNER_CRAWLER.crawlerImpl(event.id, descriptor, {});
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 300000 })
    })
})
