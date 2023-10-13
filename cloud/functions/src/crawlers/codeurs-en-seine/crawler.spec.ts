import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import axios from "axios";
import {CODEURS_EN_SEINE_CRAWLER} from "./crawler";

describe('web2day crawler', () => {
    const events = [{
        id: 'ces23', confName: `Codeurs en Seine`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/edc2612db335ba66fb99e0b3517819dd/raw/b8cf45e77c85cb691fd3c83efc58fd02c3b69403/ces23.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorResp = await axios.get(event.descriptorUrl);
            const descriptor = CODEURS_EN_SEINE_CRAWLER.descriptorParser.parse(descriptorResp.data)
            const result = await CODEURS_EN_SEINE_CRAWLER.crawlerImpl(event.id, descriptor, { dayIds: ['Vendredi'] });
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 30000 })
    })
})
