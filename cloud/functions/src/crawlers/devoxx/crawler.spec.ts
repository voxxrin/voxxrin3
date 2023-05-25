import {describe, it} from 'vitest'
import type {ConferenceDescriptor} from "../../../../../shared/conference-descriptor.firestore";
import axios from "axios";
import {DEVOXX_CRAWLER} from "./crawler";
import {EVENT_DESCRIPTOR_PARSER, FULL_EVENT_PARSER} from "../crawler-parsers";

describe('devoxx crawlers', () => {
    it(`Full event type matches zod validations`, () => {
        try {
            // This line should never raise a typescript compilation error
            // If it does, it means that CONFERENCE_DESCRIPTOR_PARSE needs to be aligned
            // with ConferenceDescriptor
            const t: ConferenceDescriptor = EVENT_DESCRIPTOR_PARSER.parse({});
            throw Error(`Unexpected code reached`)
        }catch(e) {
            // should be OK
        }
    })

    const devoxxEvents = [{
        id: 'dvgr23', confName: `Devoxx Greece 23`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/9947fc134714855116c2afd8c1856303/raw/voxxrin3-dvgr23-crawler-descriptor.json`
    }, {
        id: 'devoxxuk23', confName: `Devoxx UK 23`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/9947fc134714855116c2afd8c1856303/raw/voxxrin3-devoxxuk23-crawler-descriptor.json`
    }, {
        id: 'dvbe22', confName: `Devoxx Belgium 22`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/9947fc134714855116c2afd8c1856303/raw/voxxrin3-dvbe22-crawler-descriptor.json`
    }] as const;
    devoxxEvents.forEach(devoxxEvent => {
        it(`Loading ${devoxxEvent.confName} schedule`, async () => {
            const descriptorResp = await axios.get(devoxxEvent.descriptorUrl);
            const descriptor = DEVOXX_CRAWLER.descriptorParser.parse(descriptorResp.data)
            const result = await DEVOXX_CRAWLER.crawlerImpl(devoxxEvent.id, descriptor);
            FULL_EVENT_PARSER.parse(result);
        })
    })
})
