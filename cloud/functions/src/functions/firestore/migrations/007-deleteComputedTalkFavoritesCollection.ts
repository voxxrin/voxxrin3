import {db} from "../../../firebase";
import {FieldValue} from "firebase-admin/firestore";

export async function deleteComputedTalkFavoritesCollections(): Promise<"OK"|"Error"> {
    const existingUsersSnapshot = await db.collection("users").where("__migrated007", "==", null).get()

    await Promise.all(existingUsersSnapshot.docs.map(async user => {
        const userEvents = await db.collection(`/users/${user.id}/events/`).listDocuments()
        await Promise.all(userEvents.map(async userEvent => {
            await db.doc(`/users/${user.id}/events/${userEvent.id}/__computed/self`).delete()
        }))
        await db.doc(`/users/${user.id}`).update({
            '__migrated007': true
        })
    }))

    return "OK";
}

export async function cleanComputedTalkFavoritesCollectionsDeletion(): Promise<"OK"|"Error"> {
    const allUsersSnapshot = await db.collection('users').where("__migrated007", "==", true).get()
    await Promise.all(allUsersSnapshot.docs.map(async user => {
        await db.doc(`/users/${user.id}`).update({
            '__migrated007': FieldValue.delete()
        })
    }))

    return "OK";
}
