import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {CODEURS_EN_SEINE_CRAWLER} from "./crawler";
import {http} from "../utils";
import {sanityCheckEvent} from "../crawl";

describe('codeurs-en-seine crawler', () => {
    const events = [{
        id: 'ces23', confName: `Codeurs en Seine`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/edc2612db335ba66fb99e0b3517819dd/raw/ces23.json`
    }, {
      id: 'ces24', confName: `Codeurs en Seine`,
      descriptorUrl: `https://gist.githubusercontent.com/fcamblor/edc2612db335ba66fb99e0b3517819dd/raw/ces24.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await http.get(event.descriptorUrl);
            const descriptor = CODEURS_EN_SEINE_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await CODEURS_EN_SEINE_CRAWLER.crawlerImpl(event.id, descriptor, { dayIds: ['Vendredi'] });
            FULL_EVENT_PARSER.parse(result);

            const errorMessages = sanityCheckEvent(result);
            if(errorMessages.length) {
              throw new Error(`Some sanity checks were encountered: \n${errorMessages.map(msg => `  ${msg}`).join("\n")}`);
            }
        }, { timeout: 30000 })
    })
})
