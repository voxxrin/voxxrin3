import {describe} from 'vitest'
import {CAMPING_DES_SPEAKERS_CRAWLER} from "./crawler";
import {createCrawlingTestsFor} from "../spec-utils";

describe('camping-des-speakers crawler', () => {
    const events = [{
        id: 'cds23', confName: `Camping des Speakers`,
        descriptorUrl: `https://gist.githubusercontent.com/fcamblor/ffd1fa7fd6429d5fd08c43260cebee0c/raw/camping-des-speakers.json`
    }];

    createCrawlingTestsFor(events, CAMPING_DES_SPEAKERS_CRAWLER);
});
