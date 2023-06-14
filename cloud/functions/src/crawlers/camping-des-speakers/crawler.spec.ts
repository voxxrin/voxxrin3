import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import axios from "axios";
import {CAMPING_DES_SPEAKERS_CRAWLER} from "./crawler";

describe('camping-des-speakers crawler', () => {
    const events = [{
        id: 'cds23', confName: `Camping des Speakers`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/ffd1fa7fd6429d5fd08c43260cebee0c/raw/camping-des-speakers.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorResp = await axios.get(event.descriptorUrl);
            const descriptor = CAMPING_DES_SPEAKERS_CRAWLER.descriptorParser.parse(descriptorResp.data)
            const result = await CAMPING_DES_SPEAKERS_CRAWLER.crawlerImpl(event.id, descriptor, { dayIds: ['Jeudi'] });
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 30000 })
    })
})
