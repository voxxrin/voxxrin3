import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {LA_PRODUCT_CONF_CRAWLER} from "./crawler";
import {http} from "../utils";

describe('la-product-conf crawler', () => {
    const events = [
      {
        id: 'lpc23', confName: `La Product Conf '23`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/3792cefa3505544b18bf17e25f7965df/raw/voxxrin3-laproductconf23.json`,
        skipped: true
      // }, {
      //   id: 'lpc24', confName: `La Product Conf '24`,
      //   descriptorUrl: `https://gist.githubusercontent.com/fcamblor/3792cefa3505544b18bf17e25f7965df/raw/voxxrin3-laproductconf24.json`,
      //   skipped: false
      }
    ] as const;
    events.forEach(event => {
        (event.skipped?it.skip:it)(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await http.get(event.descriptorUrl);
            const descriptor = LA_PRODUCT_CONF_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await LA_PRODUCT_CONF_CRAWLER.crawlerImpl(event.id, descriptor, {});
            FULL_EVENT_PARSER.parse(result);
        })
    })
})
