import {db, info} from "../../../firebase";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;
import {DailySchedule, Talk} from "@shared/daily-schedule.firestore";
import {FeedbackRatings} from "@shared/talk-feedbacks.firestore";
import {
    DailyTalkFeedbackRatings
} from "@shared/conference-organizer-space.firestore";


export async function introduceOrganizerSpaceDailyRatings(): Promise<"OK"|"Error"> {
    const events = await db.collection(`events`).listDocuments();

    await Promise.all(events.map(async event => {
        const orgaSpaces = await db.collection(`events/${event.id}/organizer-space`).listDocuments()
        if(!orgaSpaces?.length) {
            info(`No organizer space found for event ${event.id} => skipping !`)
            return;
        }

        const secretOrgaToken = orgaSpaces[0].id;

        const eventDayDocs = await db.collection(`events/${event.id}/days`).listDocuments() as DocumentReference<DailySchedule>[];
        const dailySchedules = await Promise.all(eventDayDocs.map(async doc => (await doc.get()).data()!));

        await Promise.all(dailySchedules.map(async dailySchedule => {
            const talks = dailySchedule.timeSlots.reduce((talks, timeslot) => {
                if(timeslot.type === 'talks') {
                    talks.push(...timeslot.talks);
                }
                return talks;
            }, [] as Talk[])

            await db.runTransaction(async transaction => {
                const talksRatings = await Promise.all(talks.map(async talk => {
                    const talkRatings = ((await transaction.get(db.doc(`events/${event.id}/organizer-space/${secretOrgaToken}/ratings/${talk.id}`))).data() || {}) as Record<string, FeedbackRatings>

                    return { talkId: talk.id, talkRatings };
                }))

                const perTalkIdRatings = talksRatings.reduce((perTalkIdRatings, talkRatings) => {
                    perTalkIdRatings[talkRatings.talkId] = talkRatings.talkRatings;
                    return perTalkIdRatings
                }, {} as DailyTalkFeedbackRatings)

                await transaction.set(db.doc(`events/${event.id}/organizer-space/${secretOrgaToken}/daily-ratings/${dailySchedule.day}`), perTalkIdRatings);
            })
        }));
    }))

    return "OK"
}
