import {describe} from 'vitest'
import {LA_PRODUCT_CONF_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

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
    ];

    createCrawlingTestsFor(events, LA_PRODUCT_CONF_CRAWLER);
})
