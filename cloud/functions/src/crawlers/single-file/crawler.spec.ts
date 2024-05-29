import {describe, it} from 'vitest'
import {SINGLE_FILE_CRAWLER} from "./crawler";
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {http} from "../utils";

describe('single-file crawlers', () => {
    const events = [{
        id: '4sh-seminary24', confName: `4SH Seminary '24`,
        rawDescriptor: async () => http.get(`https://gist.githubusercontent.com/fcamblor/d1e61674fc0ebe37e5aef55b9e0927ee/raw/4sh-seminary.json`),
        skipped: false,
    }] as const;

    events.forEach(event => {
        (event.skipped ? it.skip : it)(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await event.rawDescriptor();
            const descriptor = SINGLE_FILE_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await SINGLE_FILE_CRAWLER.crawlerImpl(event.id, descriptor, {});
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 300000 })
    })
})
