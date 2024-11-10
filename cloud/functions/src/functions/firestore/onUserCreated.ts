import {db, info} from "../../firebase"
import {v4 as uuidv4} from "uuid";
import {User} from "../../../../../shared/user.firestore";
import {ISODatetime} from "../../../../../shared/type-utils";
import {AuthBlockingEvent} from "firebase-functions/lib/common/providers/identity";


/**
 * Purpose of this function is to initialize a public user token for every users entries
 */
export const onUserCreated = async (event: AuthBlockingEvent) => {
    if(!event.data) {
      return;
    }

    info(`User created triggered: ${event.data.uid}`)
    await createUserInfos(event.data.uid);
};

export function defaultUserInfos(userId: string) {
  const publicUserToken = uuidv4();
  const now = new Date().toISOString() as ISODatetime
  const user: User = {
    privateUserId: userId,
    publicUserToken,
    userCreation: now,
    userLastConnection: now,
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

  return user;
}

export async function createUserInfos(userId: string) {
    const user = defaultUserInfos(userId);
    await db.collection('users').doc(userId).set(user);
}

function generateRandom15DigitInteger() {
    const nineDigits = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
    const sixDigits = Math.floor(Math.random() * 1e6).toString().padStart(6, '0');

    return nineDigits + sixDigits;
}
