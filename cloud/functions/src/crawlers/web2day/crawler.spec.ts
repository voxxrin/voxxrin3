import {describe} from 'vitest'
import {WEB2DAY_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe.skip('web2day crawler', () => {
    const events = [{
        id: 'w2d23', confName: `Web2Day`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/7ebedb75e49f405206ab4f307868996b/raw/voxxrin3-web2day.json`
    }];

    createCrawlingTestsFor(events, WEB2DAY_CRAWLER);
})
