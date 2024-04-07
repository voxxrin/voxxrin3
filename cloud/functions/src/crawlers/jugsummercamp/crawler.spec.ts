import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {JUG_SUMMERCAMP_CRAWLER} from "./crawler";
import {http} from "../utils";

describe('jugsummercamp crawler', () => {
    const events = [{
        id: 'jsc23', confName: `JUG Summer Camp`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/e103104b3a5858550ff31aef6a47726c/raw/jsc23.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await http.get(event.descriptorUrl);
            const descriptor = JUG_SUMMERCAMP_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await JUG_SUMMERCAMP_CRAWLER.crawlerImpl(event.id, descriptor, { dayIds: ['Vendredi'] });
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 30000 })
    })
})
