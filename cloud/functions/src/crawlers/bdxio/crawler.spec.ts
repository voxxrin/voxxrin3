import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import axios from "axios";
import {BDXIO_CRAWLER} from "./crawler";

describe('web2day crawler', () => {
    const events = [{
        id: 'bdxio23', confName: `BDX I/O`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/6686a931d1904e043085240bf3de5550/raw/bdxio23.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorResp = await axios.get(event.descriptorUrl);
            const descriptor = BDXIO_CRAWLER.descriptorParser.parse(descriptorResp.data)
            const result = await BDXIO_CRAWLER.crawlerImpl(event.id, descriptor, { dayIds: ['Vendredi'] });
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 90000 })
    })
})
