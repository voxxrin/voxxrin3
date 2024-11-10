import {cleanOutdatedUsers as cleanOutdatedUsersService} from "../functions/firestore/services/user-utils";


export async function cleanOutdatedUsers(opts: { force: boolean, dryRun: boolean } = { force: false, dryRun: false }) {
  return await cleanOutdatedUsersService(opts);
}
