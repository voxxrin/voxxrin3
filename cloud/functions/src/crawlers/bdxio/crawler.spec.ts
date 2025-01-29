import {describe} from 'vitest'
import {BDXIO_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe.skip('bdxio crawler', () => {
    const events = [{
        id: 'bdxio23', confName: `BDX I/O`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/6686a931d1904e043085240bf3de5550/raw/bdxio23.json`
    }];

    createCrawlingTestsFor(events, BDXIO_CRAWLER);
})
