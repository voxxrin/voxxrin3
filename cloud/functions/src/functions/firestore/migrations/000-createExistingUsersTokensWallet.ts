import {db} from "../../../firebase";
import {createEmptyUserTokenWallet} from "../onUserCreated";

export async function createExistingUsersTokensWallet(): Promise<"OK"|"Error"> {
    const existingUsers = await db.collection("users").listDocuments()

    await Promise.all(existingUsers.map(async existingUser => {
        const tokensWallet = await db
            .collection("users").doc(existingUser.id)
            .collection("tokens-wallet").doc("self")
            .get()

        if(!tokensWallet.exists) {
            await createEmptyUserTokenWallet(existingUser.id);
        }
    }))

    return "OK";
}
