import {db} from "../../../firebase";
import {UserPreferences} from "../../../../../../shared/user-preferences.firestore";

export async function gettingRidOfUserPreferencesPastEvents(): Promise<"OK"|"Error"> {
    const existingUsers = await db.collection("users").listDocuments()

    await Promise.all(existingUsers.map(async existingUser => {
        const preferencesRef = db
            .collection("users").doc(existingUser.id)
            .collection("preferences").doc("self")

        const preferencesSnap = await preferencesRef.get();

        if(preferencesSnap.exists) {
            const preferences = preferencesSnap.data() as (UserPreferences & {showPastEvents?:boolean})
            delete preferences.showPastEvents;
            await preferencesRef.set(preferences);
        }
    }))

    return "OK";
}
