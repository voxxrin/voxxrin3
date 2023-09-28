import {db} from "../../../firebase";
import {
    PerPublicUserIdFeedbackRatings
} from "../../../../../../shared/conference-organizer-space.firestore";


export type OldConferenceOrganizerAllRatings = {
    [talkId: string]: PerPublicUserIdFeedbackRatings
}

export async function refactoOrgaSpaceRatingsToPerTalkRatings(): Promise<"OK"|"Error"> {
    const events = await db.collection(`events`).listDocuments();

    await Promise.all(events.map(async event => {
        const orgaSpaces = await db.collection(`events/${event.id}/organizer-space`).listDocuments()
        if(!orgaSpaces?.length) {
            console.log(`No organizer space found for event ${event.id} => skipping !`)
            return;
        }

        const talkDocs = await db.collection(`events/${event.id}/talks`).listDocuments();

        await db.runTransaction(async transaction => {
            const everyTalksRatings = db.doc(`events/${event.id}/organizer-space/${orgaSpaces[0].id}/ratings/self`);
            const ratings = (await everyTalksRatings.get()).data() as OldConferenceOrganizerAllRatings|undefined

            if(!ratings) {
                console.log(`ratings already migrated for event ${event.id} => skipping !`)
                return;
            }

            await Promise.all(talkDocs.map(async talkDoc => {
                if(ratings[talkDoc.id]) {
                    const perUserFeedbackRatings: PerPublicUserIdFeedbackRatings = ratings[talkDoc.id];
                    return db.doc(`events/${event.id}/organizer-space/${orgaSpaces[0].id}/ratings/${talkDoc.id}`).set(perUserFeedbackRatings)
                } else {
                    return db.doc(`events/${event.id}/organizer-space/${orgaSpaces[0].id}/ratings/${talkDoc.id}`).set({})
                }
            }))

            await everyTalksRatings.delete();
        })
    }))

    return "OK"
}
