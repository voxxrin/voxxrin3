import {describe} from 'vitest'
import {DEVOXX_SCALA_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

// Skipped because voxxedlu devoxx-scala instance is no longer available
describe.skip('devoxx scala crawlers', () => {
    const events = [
      {
        id: 'vxdlu23', confName: `Voxxed Luxembourg 2023`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/c950c503d29845e72974e7ea59bf6fec/raw/3c48d47353ce60d55d650475686ddf02207544e1/voxxedlu23.json`
      }
    ];

    createCrawlingTestsFor(events, DEVOXX_SCALA_CRAWLER);
})
