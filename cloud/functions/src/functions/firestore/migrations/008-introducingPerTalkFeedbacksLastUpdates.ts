import {db} from "../../../firebase";
import {EventLastUpdates} from "../../../../../../shared/event-list.firestore";
import {ISODatetime, Replace} from "../../../../../../shared/type-utils";


export async function introducingPerTalkFeedbacksLastUpdates(): Promise<"OK"|"Error"> {
    const events = await db.collection(`events`).listDocuments();

    await Promise.all(events.map(async event => {
        await db.runTransaction(async transaction => {
            const talks = await db.collection(`events/${event.id}/talks`).listDocuments()

            const lastUpdatesDoc = db.doc(`events/${event.id}/last-updates/self`);
            const lastUpdatesVal = (await transaction.get(lastUpdatesDoc)).data() as Replace<EventLastUpdates, {feedbacks: ISODatetime}>

            if(!lastUpdatesVal) {
                console.log(`Event ${event.id} doesn't have any value for last-updates node => skipping !`)
                return;
            }

            const { feedbacks: allFeedbacks, ...otherFields } = lastUpdatesVal;

            if(otherFields.allFeedbacks) {
                console.log(`Event ${event.id} already migrated => skipping !`)
                return;
            }

            const nullableAllFeedbacks: ISODatetime|null = allFeedbacks ? allFeedbacks : null
            const newFeedbacksNode = talks.reduce((newFeedbacksNode, talk) => {
                newFeedbacksNode[talk.id] = nullableAllFeedbacks;
                return newFeedbacksNode;
            }, {} as Partial<NonNullable<EventLastUpdates['feedbacks']>>) as NonNullable<EventLastUpdates['feedbacks']>;

            const migratedLastUpdates: EventLastUpdates = {
                ...otherFields,
                allFeedbacks: nullableAllFeedbacks,
                feedbacks: newFeedbacksNode
            }

            await transaction.update(lastUpdatesDoc, migratedLastUpdates);
        })
    }))

    return "OK"
}
