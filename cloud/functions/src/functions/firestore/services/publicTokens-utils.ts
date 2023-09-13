import {db} from "../../../firebase";
import {FamilyEventsStatsAccessToken, PublicToken} from "../../../../../../shared/public-tokens";


export function isFamilyEventsStats(publicToken: PublicToken): publicToken is FamilyEventsStatsAccessToken {
    return publicToken.type === 'FamilyEventsStatsAccess';
}

export async function getFamilyEventsStatsToken(token: string) {
    const publicTokenDoc = await db.doc(`/public-tokens/${token}`).get();

    if(!publicTokenDoc.exists) {
        throw new Error(`Invalid family events stats token: ${token}`);
    }

    const publicTokenSnap = publicTokenDoc.data() as PublicToken;

    if(!isFamilyEventsStats(publicTokenSnap)) {
        throw new Error(`Expectation mismatch: public token ${token} is not a family events stats token !`)
    }

    return publicTokenSnap;
}
