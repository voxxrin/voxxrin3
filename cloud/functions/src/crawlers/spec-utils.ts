import {it} from "vitest";
import {http} from "./utils";
import {FULL_EVENT_PARSER} from "./crawler-parsers";
import {CrawlerKind, sanityCheckEvent} from "./crawl";

export type EventCrawlerTestDefinition = {
  id: string, confName: string,
  descriptorUrl: string,
  skipped?: boolean,
}

export function createCrawlingTestsFor(eventCrawlerTestDefinitions: EventCrawlerTestDefinition[], crawler: CrawlerKind<any>, avoidConsideringSanityWarningsAsErrors?: boolean) {
  eventCrawlerTestDefinitions.forEach(eventCrawlerTestDefinition => {
    (eventCrawlerTestDefinition.skipped ? it.skip : it)(`Loading ${eventCrawlerTestDefinition.confName} schedule`, async () => {
      const descriptorPayload = await http.get(eventCrawlerTestDefinition.descriptorUrl);
      const descriptor = crawler.descriptorParser.parse(descriptorPayload)
      const result = await crawler.crawlerImpl(eventCrawlerTestDefinition.id, descriptor, {});
      FULL_EVENT_PARSER.parse(result);

      const sanityCheckMessages = sanityCheckEvent(result);
      const warningMessages = sanityCheckMessages.filter(message => message.severity === 'WARNING');
      const errorMessages = sanityCheckMessages.filter(message => message.severity === 'ERROR');

      if(warningMessages.length) {
        console.warn([
          `Some sanity check WARNINGS were encountered:`,
          ...warningMessages.map(message => `  ${message.msg}`)
        ].join("\n"))
      }
      if(errorMessages.length || (!avoidConsideringSanityWarningsAsErrors && sanityCheckMessages.length)) {
        throw new Error([
          `Some sanity check ERRORS were encountered:`,
          ...sanityCheckMessages.map(message => `  ${message.severity}: ${message.msg}`)
        ].join("\n"))
      }
    }, { timeout: 300000 })
  })
}
