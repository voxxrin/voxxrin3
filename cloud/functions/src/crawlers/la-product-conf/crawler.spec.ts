import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import axios from "axios";
import {LA_PRODUCT_CONF_CRAWLER} from "./crawler";

describe('la-product-conf crawler', () => {
    const events = [{
        id: 'lpc23', confName: `La Product Conf`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/3792cefa3505544b18bf17e25f7965df/raw/voxxrin3-laproductconf.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorResp = await axios.get(event.descriptorUrl);
            const descriptor = LA_PRODUCT_CONF_CRAWLER.descriptorParser.parse(descriptorResp.data)
            const result = await LA_PRODUCT_CONF_CRAWLER.crawlerImpl(event.id, descriptor);
            FULL_EVENT_PARSER.parse(result);
        })
    })
})
