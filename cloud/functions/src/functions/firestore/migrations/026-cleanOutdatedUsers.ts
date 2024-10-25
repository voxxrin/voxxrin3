import {cleanOutdatedUsers as cleanOutdatedUsersService} from "../services/user-utils";


export async function cleanOutdatedUsers(): Promise<"OK"|"Error"> {
  await cleanOutdatedUsersService();

  return "OK"
}
