import {createUserInfos} from "../onUserCreated";
import {db} from "../../../firebase";

export async function createExistingUsersInfos(): Promise<"OK"|"Error"> {
    const existingUsers = await db.collection("users").listDocuments()

    await Promise.all(existingUsers.map(async existingUser => {
        const userInfos = await db.collection('users').doc(existingUser.id).get()

        if(!userInfos.exists) {
            await createUserInfos(existingUser.id);
        }
    }))

    return "OK";
}
