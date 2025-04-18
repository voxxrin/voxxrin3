import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {
  getEventStatsValidToken,
  getFamilyOrEventOrganizerToken,
  getRoomStatsContributorValidToken
} from "../../firestore/services/publicTokens-utils";
import {match, P} from "ts-pattern";
import {PublicToken} from "@shared/public-tokens";
import {getCrawlersMatching} from "../../firestore/services/crawlers-utils";
import {FieldPath} from "firebase-admin/firestore";
import {ConferenceDescriptor} from "@shared/conference-descriptor.firestore";
import {FIREBASE_CRAWLER_DESCRIPTOR_PARSER} from "../../../crawlers/crawler-parsers";
import {z} from "zod";


export function publicEndpoint() {
  return async () => {};
}

export function ensureHasSuperAdminToken() {
  return async (pathParams: any, queryParams: { token: string }) => {
    const token = queryParams.token;
    if(process.env.MIGRATION_TOKEN !== token) {
      throw new Error(`invalid migrationToken !`)
    }
  }
}

function ensureEventBasedTokenPredicateIsValid<
  T extends PublicToken,
  E extends { eventFamily: string, eventName: string },
  PATH_PARAMS extends Record<string, string>,
>(
  entityResolver: (pathParams: PATH_PARAMS) => Promise<E>,
  publicTokenResolver: (token: string) => Promise<T>,
  onError: (type: "family-based-token"|"event-based-token", name: string, pathParams: PATH_PARAMS) => string,
) {
  return async (pathParams: PATH_PARAMS, queryParams: { token: string }) => {
    const token = queryParams.token;

    const entity = await entityResolver(pathParams);
    const matchingPublicToken = await publicTokenResolver(token);

    const validationErrorMessage = match(matchingPublicToken as PublicToken)
      .with({ eventFamilies: P.array(P.string) }, ({ eventFamilies: tokenEventFamilies }) => {
        if(!entity.eventFamily || !tokenEventFamilies.includes(entity.eventFamily)) {
          return onError('family-based-token', entity.eventFamily, pathParams);
        }
        return undefined;
      }).with({ eventNames: P.array(P.string) }, ({ eventNames: tokenEventNames }) => {
        if(!entity.eventName || !tokenEventNames.includes(entity.eventName)) {
          return onError('event-based-token', entity.eventName, pathParams)
        }
        return undefined;
      }).with({ spaceTokens: P.array(P.string) }, ({ spaceTokens }) => {
        return `Private Space token is not supposed to be provided here !`
      }).exhaustive();

    if(validationErrorMessage) {
      throw new Error(validationErrorMessage);
    }

    return entity;
  }
}

async function resolveEventById({ eventId, maybeSpaceToken }: { eventId: string, maybeSpaceToken?: string|undefined }): Promise<ConferenceDescriptor> {
  const eventDescriptor = await getEventDescriptor(maybeSpaceToken, eventId);

  if(!eventDescriptor) {
    throw new Error(`No event found with id ${eventId} (spaceToken=${maybeSpaceToken})`)
  }

  return eventDescriptor;
}

async function resolveCrawlerById({ crawlerId }: { crawlerId: string, maybeSpaceToken?: string|undefined }): Promise<z.infer<typeof FIREBASE_CRAWLER_DESCRIPTOR_PARSER> & {id: string}> {

  const crawlerDescriptors = await getCrawlersMatching(crawlerColl => crawlerColl.where(FieldPath.documentId(), "==", crawlerId))

  if(!crawlerDescriptors.length) {
    throw new Error(`No crawler found with id ${crawlerId}`)
  }

  return crawlerDescriptors[0];
}

function eventBasedErrors(type: "family-based-token"|"event-based-token", name: string, pathParams: { eventId: string, spaceToken?: string|undefined }) {
  return match(type)
    .with('family-based-token', () => `Provided event family-based token doesn't match with event ${pathParams.eventId} family: [${name}]`)
    .with('event-based-token', () => `Provided event-based token doesn't match with event ${pathParams.eventId} name: [${name}]`)
    .exhaustive()
}

function crawlerBasedErrors(type: "family-based-token"|"event-based-token", name: string, pathParams: { crawlerId: string, spaceToken?: string|undefined }) {
  return match(type)
    .with('family-based-token', () => `Provided event family-based token doesn't match with crawler ${pathParams.crawlerId} family: [${name}]`)
    .with('event-based-token', () => `Provided event-based token doesn't match with crawler ${pathParams.crawlerId} name: [${name}]`)
    .exhaustive()
}

export function ensureHasFamilyOrEventOrganizerToken() {
  return ensureEventBasedTokenPredicateIsValid(
    resolveEventById, (token) => getFamilyOrEventOrganizerToken(token),
    eventBasedErrors)
}

export function ensureHasCrawlerFamilyOrEventOrganizerToken() {
  return ensureEventBasedTokenPredicateIsValid(
    resolveCrawlerById, (token) => getFamilyOrEventOrganizerToken(token),
    crawlerBasedErrors)
}

export function legacyEnsureHasCrawlerFamilyOrEventOrganizerToken() {
  return ensureEventBasedTokenPredicateIsValid(
    ({eventId, spaceToken }) => resolveCrawlerById({ crawlerId: eventId, maybeSpaceToken: spaceToken }), (token) => getFamilyOrEventOrganizerToken(token),
    eventBasedErrors)
}

export function ensureHasEventStatsValidToken() {
  return ensureEventBasedTokenPredicateIsValid(
    resolveEventById, (token) => getEventStatsValidToken(token),
    eventBasedErrors)
}

export function ensureHasRoomStatsContributorValidToken() {
  return ensureEventBasedTokenPredicateIsValid(
    resolveEventById, (token) => getRoomStatsContributorValidToken(token),
    eventBasedErrors)
}
