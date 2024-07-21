import {db} from "../../../firebase";
import {ensureRoomsStatsFilledFor} from "../services/stats-utils";


export async function introduceRoomsStats(): Promise<"OK"|"Error"> {
  const events = await db.collection(`events`).listDocuments();
  const spaceToken = undefined

  await Promise.all(events.map(async event => {
    return ensureRoomsStatsFilledFor(spaceToken, event.id);
  }))

  return "OK"
}
