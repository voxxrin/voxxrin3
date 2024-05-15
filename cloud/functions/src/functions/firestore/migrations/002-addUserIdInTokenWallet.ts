
export async function addUserIdInTokenWallet(): Promise<"OK"|"Error"> {
    // const existingUsers = await db.collection("users").listDocuments()
    //
    // await Promise.all(existingUsers.map(async existingUser => {
    //     const tokensWalletRef = db
    //         .collection("users").doc(existingUser.id)
    //         .collection("tokens-wallet").doc("self")
    //
    //     const tokensWalletSnap = await tokensWalletRef.get();
    //
    //     if(tokensWalletSnap.exists) {
    //         const tokenWallet = tokensWalletSnap.data() as UserTokensWallet
    //         tokenWallet.privateUserId = existingUser.id;
    //         await tokensWalletRef.set(tokenWallet);
    //     }
    // }))

    return "OK";
}
