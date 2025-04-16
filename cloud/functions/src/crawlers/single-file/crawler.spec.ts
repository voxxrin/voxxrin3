import {describe} from 'vitest'
import {SINGLE_FILE_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe('single-file crawlers', () => {
    const events = [{
        id: '4sh-seminary24', confName: `4SH Seminary '24`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/d1e61674fc0ebe37e5aef55b9e0927ee/raw/4sh-seminary.json`,
        skipped: false,
    }];

    createCrawlingTestsFor(events, SINGLE_FILE_CRAWLER);
})
