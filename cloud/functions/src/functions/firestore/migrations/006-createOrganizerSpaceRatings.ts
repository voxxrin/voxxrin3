import {db} from "../../../firebase";
import {UserPreferences} from "../../../../../../shared/user-preferences.firestore";
import {getSecretTokenRef} from "../firestore-utils";
import {TalkAttendeeFeedback} from "../../../../../../shared/talk-feedbacks.firestore";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

export async function createOrganizerSpaceRatings(): Promise<"OK"|"Error"> {
    const existingEvents = await db.collection("events").listDocuments()

    await Promise.all(existingEvents.map(async event => {
        const organizerSpaceRef = await getSecretTokenRef(`/events/${event.id}/organizer-space`)

        const talkRefs = await db.collection(`/events/${event.id}/talks`).listDocuments()

        const nodesToUpdate: Array<{ref: DocumentReference, path: string, ratings: TalkAttendeeFeedback['ratings']}> = [];

        // First, ensuring every ratings nodes are created
        await Promise.all(talkRefs.map(async talk => {
            try {
                const talkFeedbackAccessRef = await getSecretTokenRef(`/events/${event.id}/talks/${talk.id}/feedbacks-access`)
                const talkFeedbacks = await talkFeedbackAccessRef.collection('feedbacks').listDocuments()

                await Promise.all(talkFeedbacks.map(async talkFeedbackDoc => {
                    const talkFeedback = (await talkFeedbackDoc.get()).data() as TalkAttendeeFeedback
                    const ratingsRef = organizerSpaceRef.collection(`ratings`).doc(`self`)
                    const ratingsDoc = await ratingsRef.get();
                    if(!ratingsDoc.exists) {
                        await ratingsRef.create({});
                    }

                    nodesToUpdate.push({
                        ref: ratingsRef,
                        path: `${talkFeedback.talkId}.${talkFeedbackDoc.id}`,
                        ratings: talkFeedback.ratings
                    })
                }))
            }catch(err) {
                console.error(`No talk feedbacks-access token found in /events/${event.id}/talks/${talk.id}`)
            }
        }))

        await Promise.all(nodesToUpdate.map(async nodeToUpdate => {
            await nodeToUpdate.ref.update(nodeToUpdate.path, nodeToUpdate.ratings);
        }))
    }))

    return "OK";
}
