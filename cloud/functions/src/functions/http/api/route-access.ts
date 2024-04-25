import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {
  getEventStatsValidToken,
  getFamilyOrEventOrganizerToken,
  getRoomStatsContributorValidToken
} from "../../firestore/services/publicTokens-utils";
import {match, P} from "ts-pattern";
import {PublicToken} from "../../../../../../shared/public-tokens";


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

function ensureEventBasedTokenPredicateIsValid<T extends PublicToken>(publicTokenResolver: (token: string) => Promise<T>) {
  return async (pathParams: { eventId: string }, queryParams: { token: string }) => {
    const token = queryParams.token;

    const eventDescriptor = await getEventDescriptor(pathParams.eventId);

    if(!eventDescriptor) {
      throw new Error(`No event found with id ${pathParams.eventId}`)
    }

    const matchingPublicToken = await publicTokenResolver(token);

    const validationErrorMessage = match(matchingPublicToken as PublicToken)
      .with({ eventFamilies: P.array(P.string) }, ({ eventFamilies: tokenEventFamilies }) => {
        if(!eventDescriptor.eventFamily || !tokenEventFamilies.includes(eventDescriptor.eventFamily)) {
          return `Provided event family-based token doesn't match with event ${eventDescriptor.id} family: [${eventDescriptor.eventFamily}]`;
        }
        return undefined;
      }).with({ eventNames: P.array(P.string) }, ({ eventNames: tokenEventNames }) => {
        if(!eventDescriptor.eventName || !tokenEventNames.includes(eventDescriptor.eventName)) {
          return `Provided event-based token doesn't match with event ${eventDescriptor.id} name: [${eventDescriptor.eventName}]`
        }
        return undefined;
      }).exhaustive();

    if(validationErrorMessage) {
      throw new Error(validationErrorMessage);
    }

    return eventDescriptor;
  }
}

export function ensureHasFamilyOrEventOrganizerToken() {
  return ensureEventBasedTokenPredicateIsValid((token) => getFamilyOrEventOrganizerToken(token))
}

export function ensureHasEventStatsValidToken() {
  return ensureEventBasedTokenPredicateIsValid((token) => getEventStatsValidToken(token))
}

export function ensureHasRoomStatsContributorValidToken() {
  return ensureEventBasedTokenPredicateIsValid((token) => getRoomStatsContributorValidToken(token))
}
