import {db} from "../../../firebase";
import {
    PublicToken
} from "@shared/public-tokens";
import {match, P} from "ts-pattern";
import {logPerf} from "../../http/utils";


async function getPublicTokenBySecret<T>(secretToken: string, transformer: (publicToken: PublicToken) => T|undefined, expectedTokenName: string) {
    const publicTokenDoc = await db.doc(`/public-tokens/${secretToken}`).get();

    if(!publicTokenDoc.exists) {
        throw new Error(`Invalid public token: ${secretToken}`);
    }

    const publicTokenSnap = publicTokenDoc.data() as PublicToken;

    return match(transformer(publicTokenSnap))
        .with(P.nullish, () => {
            throw new Error(`Expectation mismatch: public token ${secretToken} is not a ${expectedTokenName} !`)
        }).otherwise((result: T) => result);
}

export async function getFamilyEventsStatsToken(secretToken: string) {
    return logPerf("getFamilyEventsStatsToken()", async () => {
        return getPublicTokenBySecret(secretToken,
          publicToken =>
            match(publicToken)
              .with({type: "FamilyEventsStatsAccessToken"}, t => t)
              .otherwise(() => undefined),
            "family events stats token")
    })
}

export async function getFamilyOrganizerToken(secretToken: string) {
    return logPerf("getFamilyOrganizerToken()", async () => {
        return getPublicTokenBySecret(secretToken,
          publicToken =>
            match(publicToken)
              .with({type: "FamilyOrganizerToken"}, t => t)
              .otherwise(() => undefined),
            "family organizer token")
    })
}
export async function getFamilyOrEventOrganizerToken(secretToken: string) {
  return logPerf("getFamilyOrEventOrganizerToken()", async () => {
    return getPublicTokenBySecret(secretToken,
      publicToken =>
        match(publicToken)
          .with({type: "FamilyOrganizerToken"}, t => t)
          .with({type: "EventOrganizerToken"}, t => t)
          .otherwise(() => undefined),
      "family or event organizer token")
  })
}

export async function getEventOrganizerToken(secretToken: string) {
    return logPerf("getEventOrganizerToken()", async () => {
        return getPublicTokenBySecret(secretToken,
          publicToken =>
            match(publicToken)
              .with({type: "EventOrganizerToken"}, t => t)
              .otherwise(() => undefined),
            "event organizer token")
    })
}

export async function getEventStatsValidToken(secretToken: string) {
  return logPerf("getEventStatsValidToken()", async () => {
    return getPublicTokenBySecret(secretToken,
      publicToken =>
        match(publicToken)
          .with({type: "EventStatsAccessToken"}, t => t)
          .with({type: "FamilyEventsStatsAccessToken"}, t => t)
          .with({type: "FamilyOrganizerToken"}, t => t)
          .with({type: "EventOrganizerToken"}, t => t)
          .otherwise(() => undefined),
      "event stats access token")
  })
}

export async function getRoomStatsContributorValidToken(secretToken: string) {
    return logPerf("getRoomStatsContributorValidToken()", async () => {
        return getPublicTokenBySecret(secretToken,
            publicToken =>
              match(publicToken)
                .with({type: "EventRoomStatsContributorToken"}, t => t)
                .with({type: "FamilyRoomStatsContributorToken"}, t => t)
                .with({type: "FamilyOrganizerToken"}, t => t)
                .with({type: "EventOrganizerToken"}, t => t)
                .otherwise(() => undefined),
            "room stats contributor token")
    })
}
