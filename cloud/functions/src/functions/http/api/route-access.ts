import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {
  getEventStatsValidToken,
  getFamilyOrEventOrganizerToken,
  getRoomStatsContributorValidToken
} from "../../firestore/services/publicTokens-utils";
import {match, P} from "ts-pattern";
import {PublicToken} from "../../../../../../shared/public-tokens";
import {getCrawlersMatching} from "../../firestore/services/crawlers-utils";
import {FieldPath} from "firebase-admin/firestore";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";
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
  E extends { eventFamily: string, eventName: string }
>(
  entityResolver: (eventId: string) => Promise<E>,
  publicTokenResolver: (token: string) => Promise<T>
) {
  return async (pathParams: { eventId: string }, queryParams: { token: string }) => {
    const token = queryParams.token;

    const entity = await entityResolver(pathParams.eventId);
    const matchingPublicToken = await publicTokenResolver(token);

    const validationErrorMessage = match(matchingPublicToken as PublicToken)
      .with({ eventFamilies: P.array(P.string) }, ({ eventFamilies: tokenEventFamilies }) => {
        if(!entity.eventFamily || !tokenEventFamilies.includes(entity.eventFamily)) {
          return `Provided event family-based token doesn't match with event ${pathParams.eventId} family: [${entity.eventFamily}]`;
        }
        return undefined;
      }).with({ eventNames: P.array(P.string) }, ({ eventNames: tokenEventNames }) => {
        if(!entity.eventName || !tokenEventNames.includes(entity.eventName)) {
          return `Provided event-based token doesn't match with event ${pathParams.eventId} name: [${entity.eventName}]`
        }
        return undefined;
      }).exhaustive();

    if(validationErrorMessage) {
      throw new Error(validationErrorMessage);
    }

    return entity;
  }
}

async function resolveEventById(eventId: string): Promise<ConferenceDescriptor> {
  const eventDescriptor = await getEventDescriptor(eventId);

  if(!eventDescriptor) {
    throw new Error(`No event found with id ${eventId}`)
  }

  return eventDescriptor;
}

async function resolveCrawlerById(eventId: string): Promise<z.infer<typeof FIREBASE_CRAWLER_DESCRIPTOR_PARSER> & {id: string}> {

  const crawlerDescriptors = await getCrawlersMatching(crawlerColl => crawlerColl.where(FieldPath.documentId(), "==", eventId))

  if(!crawlerDescriptors.length) {
    throw new Error(`No crawler found with id ${eventId}`)
  }

  return crawlerDescriptors[0];
}

export function ensureHasFamilyOrEventOrganizerToken() {
  return ensureEventBasedTokenPredicateIsValid(resolveEventById, (token) => getFamilyOrEventOrganizerToken(token))
}

export function ensureHasCrawlerFamilyOrEventOrganizerToken() {
  return ensureEventBasedTokenPredicateIsValid(resolveCrawlerById, (token) => getFamilyOrEventOrganizerToken(token))
}

export function ensureHasEventStatsValidToken() {
  return ensureEventBasedTokenPredicateIsValid(resolveEventById, (token) => getEventStatsValidToken(token))
}

export function ensureHasRoomStatsContributorValidToken() {
  return ensureEventBasedTokenPredicateIsValid(resolveEventById, (token) => getRoomStatsContributorValidToken(token))
}
