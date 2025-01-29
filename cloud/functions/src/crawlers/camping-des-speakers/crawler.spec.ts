import {describe, it} from 'vitest'
import {FULL_EVENT_PARSER} from "../crawler-parsers";
import {CAMPING_DES_SPEAKERS_CRAWLER} from "./crawler";
import {http} from "../utils";
import {sanityCheckEvent} from "../crawl";

describe('camping-des-speakers crawler', () => {
    const events = [{
        id: 'cds23', confName: `Camping des Speakers`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/ffd1fa7fd6429d5fd08c43260cebee0c/raw/camping-des-speakers.json`
    }] as const;
    events.forEach(event => {
        it(`Loading ${event.confName} schedule`, async () => {
            const descriptorPayload = await http.get(event.descriptorUrl);
            const descriptor = CAMPING_DES_SPEAKERS_CRAWLER.descriptorParser.parse(descriptorPayload)
            const result = await CAMPING_DES_SPEAKERS_CRAWLER.crawlerImpl(event.id, descriptor, { dayIds: ['Jeudi'] });
            FULL_EVENT_PARSER.parse(result);

            const errorMessages = sanityCheckEvent(result);
            if(errorMessages.length) {
              throw new Error(`Some sanity checks were encountered: \n${errorMessages.map(msg => `  ${msg}`).join("\n")}`);
            }
        }, { timeout: 30000 })
    })
})
