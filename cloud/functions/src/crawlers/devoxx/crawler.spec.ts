import {describe, it} from 'vitest'
import {DEVOXX_CRAWLER, DEVOXX_DESCRIPTOR_PARSER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe('devoxx crawlers', () => {
    it(`Full event type matches zod validations`, () => {
        try {
            // This line should never raise a typescript compilation error
            // If it does, it means that CONFERENCE_DESCRIPTOR_PARSE needs to be aligned
            // with ConferenceDescriptor
            const t = DEVOXX_DESCRIPTOR_PARSER.parse({});
            throw Error(`Unexpected code reached`)
        }catch(e) {
            // should be OK
        }
    })

    const events = [{
        id: 'dvgr23', confName: `Devoxx Greece 23`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/9947fc134714855116c2afd8c1856303/raw/voxxrin3-dvgr23-crawler-descriptor.json`,
        skipped: false,
    }, {
        id: 'devoxxuk23', confName: `Devoxx UK 23`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/9947fc134714855116c2afd8c1856303/raw/voxxrin3-devoxxuk23-crawler-descriptor.json`,
        skipped: false,
    }, {
        id: 'dvbe22', confName: `Devoxx Belgium 22`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/9947fc134714855116c2afd8c1856303/raw/voxxrin3-dvbe22-crawler-descriptor.json`,
        // De-activated because we get an error about self-signed certificate on dvbe22.cfp.dev URL
        skipped: true,
    }, {
        id: 'dvbe23', confName: `Devoxx Belgium 23`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/7d91c0273c16580bd1ef106d0a8097e6/raw/dvbe.json`,
        skipped: false,
    }, {
        id: 'dvbe24', confName: `Devoxx Belgium 24`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/7d91c0273c16580bd1ef106d0a8097e6/raw/dvbe24.json`,
        skipped: false,
    }, {
        id: 'vdams25', confName: `Voxxed Amsterdam 25`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/e4251172b6fff3d9df0937135295b859/raw/vdams25.json`,
        skipped: false,
    }, {
        id: 'vdz25', confName: `Voxxed Zurich 25`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/e4251172b6fff3d9df0937135295b859/raw/vdz25.json`,
        skipped: false,
    }, {
        id: 'vdloa25', confName: `Voxxed Loannina 25`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/e4251172b6fff3d9df0937135295b859/raw/vdloa25.json`,
        skipped: false,
    }, {
      id: 'vdbuh2025', confName: `Voxxed Bucharest 25`,
      descriptorUrl: `https://gist.githubusercontent.com/stephanj/e4251172b6fff3d9df0937135295b859/raw/vdbuh2025.json`,
      skipped: false,
    }, {
        id: 'devoxxfr2025', confName: `Devoxx France 2025`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/7d91c0273c16580bd1ef106d0a8097e6/raw/devoxxfr2025.json`,
        skipped: false,
    }, {
        id: 'dvgr25', confName: `Devoxx Greece 25`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/7d91c0273c16580bd1ef106d0a8097e6/raw/dvgr25.json`,
        skipped: false,
    }, {
        id: 'devoxxuk25', confName: `Devoxx UK 25`,
        descriptorUrl: `https://gist.githubusercontent.com/stephanj/7d91c0273c16580bd1ef106d0a8097e6/raw/dvuk25.json`,
        skipped: false,
    }];

    createCrawlingTestsFor(events, DEVOXX_CRAWLER);
})
