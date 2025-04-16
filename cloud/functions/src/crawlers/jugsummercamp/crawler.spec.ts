import {describe} from 'vitest'
import {JUG_SUMMERCAMP_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe('jugsummercamp crawler', () => {
    const events = [{
        id: 'jsc23', confName: `JUG Summer Camp`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/e103104b3a5858550ff31aef6a47726c/raw/jsc23.json`
    }];

    createCrawlingTestsFor(events, JUG_SUMMERCAMP_CRAWLER);
})
