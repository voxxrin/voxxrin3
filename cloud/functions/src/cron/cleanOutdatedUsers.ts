import {cleanOutdatedUsers as cleanOutdatedUsersService} from "../functions/firestore/services/user-utils";


export async function cleanOutdatedUsers() {
  return await cleanOutdatedUsersService();
}
