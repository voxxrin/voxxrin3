import {db} from "../../../firebase";
import {
    FamilyEventsFeedbacksAccessToken,
    FamilyEventsStatsAccessToken,
    PublicToken
} from "../../../../../../shared/public-tokens";
import {match, P} from "ts-pattern";


export function isFamilyEventsStats(publicToken: PublicToken): publicToken is FamilyEventsStatsAccessToken {
    return publicToken.type === 'FamilyEventsStatsAccess';
}
export function isFamilyEventsFeedbacks(publicToken: PublicToken): publicToken is FamilyEventsFeedbacksAccessToken {
    return publicToken.type === 'FamilyEventsFeedbacksAccess';
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
    return getPublicTokenBySecret(secretToken,
            publicToken => isFamilyEventsStats(publicToken)?publicToken:undefined,
        "family events stats token")
}

export async function getFamilyEventsFeedbacksToken(secretToken: string) {
    return getPublicTokenBySecret(secretToken,
            publicToken => isFamilyEventsFeedbacks(publicToken)?publicToken:undefined,
        "family events feedbacks token")
}
