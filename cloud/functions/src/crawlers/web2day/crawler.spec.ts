import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import axios from "axios";
import {WEB2DAY_CRAWLER} from "./crawler";

describe('web2day crawler', () => {
    const events = [{
        id: 'w2d23', confName: `Web2Day`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/7ebedb75e49f405206ab4f307868996b/raw/voxxrin3-web2day.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorResp = await axios.get(event.descriptorUrl);
            const descriptor = WEB2DAY_CRAWLER.descriptorParser.parse(descriptorResp.data)
            const result = await WEB2DAY_CRAWLER.crawlerImpl(event.id, descriptor, { dayIds: ['Mercredi'] });
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 30000 })
    })
})
