import {db} from "../../firebase";

export async function getSecretTokenDoc<T>(path: string) {
    const list = await db.collection(path).listDocuments()
    if(list.length !== 1) {
        throw new Error(`Unexpected size=${list.length} for path [${path}] (expected=1)`)
    }

    return (await db.doc(`${path}/${list[0].id}`).get()).data() as T;
}
