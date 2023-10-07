import {db} from "../../../firebase";
import {
    FamilyOrganizerToken,
    FamilyEventsStatsAccessToken,
    PublicToken
} from "../../../../../../shared/public-tokens";
import {match, P} from "ts-pattern";
import {logPerf} from "../../http/utils";


export function isFamilyEventsStatsToken(publicToken: PublicToken): publicToken is FamilyEventsStatsAccessToken {
    return publicToken.type === 'FamilyEventsStatsAccess';
}
export function isFamilyOrganizerToken(publicToken: PublicToken): publicToken is FamilyOrganizerToken {
    return publicToken.type === 'FamilyOrganizerToken';
}

async function getPublicTokenBySecret<T>(secretToken: string, transformer: (publicToken: PublicToken) => T|undefined, expectedTokenName: string) {
    const publicTokenDoc = await db.doc(`/public-tokens/${secretToken}`).get();

    if(!publicTokenDoc.exists) {
        throw new Error(`Invalid family events stats token: ${secretToken}`);
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
            publicToken => isFamilyEventsStatsToken(publicToken) || isFamilyOrganizerToken(publicToken)?publicToken:undefined,
            "family events stats token")
    })
}

export async function getFamilyOrganizerToken(secretToken: string) {
    return logPerf("getFamilyOrganizerToken()", async () => {
        return getPublicTokenBySecret(secretToken,
            publicToken => isFamilyOrganizerToken(publicToken) ? publicToken : undefined,
            "family organizer token")
    })
}
