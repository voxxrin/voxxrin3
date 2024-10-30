import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {DEVOXX_SCALA_CRAWLER} from "./crawler";
import {http} from "../utils";

// Skipped because voxxedlu devoxx-scala instance is no longer available
describe.skip('devoxx scala crawlers', () => {
    const events = [
      {
        id: 'vxdlu23', confName: `Voxxed Luxembourg 2023`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/c950c503d29845e72974e7ea59bf6fec/raw/3c48d47353ce60d55d650475686ddf02207544e1/voxxedlu23.json`
      }
    ] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await http.get(event.descriptorUrl);
            const descriptor = DEVOXX_SCALA_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await DEVOXX_SCALA_CRAWLER.crawlerImpl(event.id, descriptor, {});
            FULL_EVENT_PARSER.parse(result);
        }, { timeout: 30000 })
    })
})
