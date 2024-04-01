import {db} from "../../../firebase";
import {ensureRoomsStatsFilledFor} from "../services/stats-utils";


export async function introduceRoomsStats(): Promise<"OK"|"Error"> {
  const events = await db.collection(`events`).listDocuments();

  await Promise.all(events.map(async event => {
    return ensureRoomsStatsFilledFor(event.id);
  }))

  return "OK"
}
