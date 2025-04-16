import {describe} from 'vitest'
import {CODEURS_EN_SEINE_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe('codeurs-en-seine crawler', () => {
    const events = [{
        id: 'ces23', confName: `Codeurs en Seine`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/edc2612db335ba66fb99e0b3517819dd/raw/ces23.json`
    }, {
      id: 'ces24', confName: `Codeurs en Seine`,
      descriptorUrl: `https://gist.githubusercontent.com/fcamblor/edc2612db335ba66fb99e0b3517819dd/raw/ces24.json`
    }];

    createCrawlingTestsFor(events, CODEURS_EN_SEINE_CRAWLER);
})
