import {db} from "../../../firebase";
import {EventLastUpdates} from "@shared/event-list.firestore";
import {ISODatetime} from "@shared/type-utils";


export async function resetFavoritesLastUpdates(): Promise<"OK"|"Error"> {
  const events = await db.collection(`events`).listDocuments();

  await Promise.all(events.map(async event => {
    const lastUpdatesDoc = await db.doc(`events/${event.id}/last-updates/self`);

    const lastUpdates = await lastUpdatesDoc.get()

    if(lastUpdates.exists) {
      await lastUpdatesDoc.update("favorites", new Date().toISOString());
    } else {
      const lastUpdatesToCreate: Partial<EventLastUpdates> = {
        favorites: new Date().toISOString() as ISODatetime
      }

      await lastUpdatesDoc.set(lastUpdatesToCreate);
    }
  }))

  return "OK"
}
