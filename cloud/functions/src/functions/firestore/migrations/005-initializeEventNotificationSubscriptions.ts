import {db} from "../../../firebase";
import {
    createEmptyEventNotificationSubscriptions,
} from "../firestore-utils";

export async function initializeEventNotificationSubscriptions(): Promise<"OK"|"Error"> {
    const existingEvents = await db.collection("events").listDocuments()

    await Promise.all(existingEvents.map(async existingEvent => {
        await createEmptyEventNotificationSubscriptions(existingEvent.id)
    }))

    return "OK";
}
