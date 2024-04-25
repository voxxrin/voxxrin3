import {sendResponseMessage} from "../utils";
import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {
  getFamilyOrEventOrganizerToken,
  getRoomStatsContributorValidToken
} from "../../firestore/services/publicTokens-utils";
import {match, P} from "ts-pattern";
import {ConferenceDescriptor} from "../../../../../../shared/conference-descriptor.firestore";


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

function ensureEventBasedTokenPredicateIsValid(predicate: (token: string, eventDescriptor: ConferenceDescriptor) => Promise<void>) {
  return async (pathParams: { eventId: string }, queryParams: { token: string }) => {
    const token = queryParams.token;

    const eventDescriptor = await getEventDescriptor(pathParams.eventId);

    if(!eventDescriptor) {
      throw new Error(`No event found with id ${pathParams.eventId}`)
    }

    await predicate(token, eventDescriptor);

    return eventDescriptor;
  }
}

export function ensureHasFamilyOrEventOrganizerToken() {
  return ensureEventBasedTokenPredicateIsValid(async (token, eventDescriptor) => {
    const familyOrEventOrganizerToken = await getFamilyOrEventOrganizerToken(token);

    const validationErrorMessage = match(familyOrEventOrganizerToken)
      .with({ type: "FamilyOrganizerToken"}, (familyOrganizerToken) => {
        if(!eventDescriptor.eventFamily || !familyOrganizerToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
          return `Provided family organizer token doesn't match with event ${eventDescriptor.id} family: [${eventDescriptor.eventFamily}]`;
        }
        return undefined;
      }).with({ type: "EventOrganizerToken" }, (eventOrganizerToken) => {
        if(!eventDescriptor.eventName || !eventOrganizerToken.eventNames.includes(eventDescriptor.eventName)) {
          return `Provided event organizer token doesn't match with event ${eventDescriptor.id} name: [${eventDescriptor.eventName}]`
        }
        return undefined;
      }).exhaustive();

    if(validationErrorMessage) {
      throw new Error(validationErrorMessage);
    }
  })
}

export function ensureHasRoomStatsContributorValidToken() {
  return ensureEventBasedTokenPredicateIsValid(async (token, eventDescriptor) => {
    const roomStatContributorToken = await getRoomStatsContributorValidToken(token);

    const validationErrorMessage = match(roomStatContributorToken)
      .with({ eventFamilies: P.array(P.string) }, ({ eventFamilies: tokenEventFamilies }) => {
        if(!eventDescriptor.eventFamily || !tokenEventFamilies.includes(eventDescriptor.eventFamily)) {
          return `Provided token doesn't match with event ${eventDescriptor.id} family: [${eventDescriptor.eventFamily}]`;
        }
        return undefined;
      }).with({ eventNames: P.array(P.string) }, ({ eventNames: tokenEventNames }) => {
        if(!eventDescriptor.eventName || !tokenEventNames.includes(eventDescriptor.eventName)) {
          return `Provided token doesn't match with event ${eventDescriptor.id} name: [${eventDescriptor.eventName}]`
        }
        return undefined;
      }).exhaustive();

    if(validationErrorMessage) {
      throw new Error(validationErrorMessage);
    }
  })
}
