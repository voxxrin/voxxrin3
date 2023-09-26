import {db} from "../../../firebase";

export async function deleteComputedTalkFavoritesCollections(): Promise<"OK"|"Error"> {
    const existingUsers = await db.collection("users").listDocuments()

    await Promise.all(existingUsers.map(async user => {
        const userEvents = await db.collection(`/users/${user.id}/events/`).listDocuments()
        await Promise.all(userEvents.map(async userEvent => {
            await db.doc(`/users/${user.id}/events/${userEvent.id}/__computed/self`).delete()
        }))
    }))

    return "OK";
}
