import {it} from "vitest";
import {http} from "./utils";
import {FULL_EVENT_PARSER} from "./crawler-parsers";
import {CrawlerKind, sanityCheckEvent} from "./crawl";

export type EventCrawlerTestDefinition = {
  id: string, confName: string,
  descriptorUrl: string,
  skipped?: boolean,
}

export function createCrawlingTestsFor(eventCrawlerTestDefinitions: EventCrawlerTestDefinition[], crawler: CrawlerKind<any>) {
  eventCrawlerTestDefinitions.forEach(eventCrawlerTestDefinition => {
    (eventCrawlerTestDefinition.skipped ? it.skip : it)(`Loading ${eventCrawlerTestDefinition.confName} schedule`, async () => {
      const descriptorPayload = await http.get(eventCrawlerTestDefinition.descriptorUrl);
      const descriptor = crawler.descriptorParser.parse(descriptorPayload)
      const result = await crawler.crawlerImpl(eventCrawlerTestDefinition.id, descriptor, {});
      FULL_EVENT_PARSER.parse(result);

      const errorMessages = sanityCheckEvent(result);
      if(errorMessages.length) {
        throw new Error(`Some sanity checks were encountered: \n${errorMessages.map(msg => `  ${msg}`).join("\n")}`);
      }
    }, { timeout: 300000 })
  })
}
