import {db, info} from "../../firebase"
import {v4 as uuidv4} from "uuid";
import {User} from "../../../../../shared/user.firestore";
import {ISODatetime} from "../../../../../shared/type-utils";
import {UserRecord} from "firebase-admin/auth";
import {EventContext} from "firebase-functions/lib/v1/cloud-functions";


/**
 * Purpose of this function is to initialize a public user token for every users entries
 */
export const onUserCreated = async (user: UserRecord, context: EventContext<{}>) => {
    info(`User created triggered: ${user.uid}`)
    await createUserInfos(user.uid);
};

export async function createUserInfos(userId: string) {
    const publicUserToken = uuidv4();
    const user: User = {
        privateUserId: userId,
        publicUserToken,
        userCreation: new Date().toISOString() as ISODatetime,
        username: `Anonymous${generateRandom15DigitInteger()}`,
        totalFavs: {
          total: 0,
          perEventTotalFavs: {}
        },
        totalFeedbacks: {
          total: 0,
          perEventTotalFeedbacks: {}
        },
        _modelRemainingMigrations: [],
        _version: 4
    }

    await db.collection('users').doc(userId).set(user);
}

function generateRandom15DigitInteger() {
    const nineDigits = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
    const sixDigits = Math.floor(Math.random() * 1e6).toString().padStart(6, '0');

    return nineDigits + sixDigits;
}
