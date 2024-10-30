import {db} from "../../../firebase";
import {
    DailySchedule,
    Talk,
    TalksTimeSlot
} from "../../../../../../shared/daily-schedule.firestore";
import {ISODatetime} from "../../../../../../shared/type-utils";
import {resolvedEventFirestorePath} from "../../../../../../shared/utilities/event-utils";


export type TimeslottedTalk = Talk & {start: ISODatetime, end: ISODatetime};

export async function getTimeslottedTalks(spaceToken: string|undefined, eventId: string): Promise<TimeslottedTalk[]> {
    const days = await db.collection(`${resolvedEventFirestorePath(eventId, spaceToken)}/days`).listDocuments()
    const dailySchedules = await Promise.all(days.map(async dayRef => {
        const dailySchedule = (await db.doc(`${resolvedEventFirestorePath(eventId, spaceToken)}/days/${dayRef.id}`).get()).data() as DailySchedule
        return dailySchedule;
    }))

    const talkTimeslots = dailySchedules
        .flatMap(dailySchedule => dailySchedule.timeSlots)
        .filter(timeslot => timeslot.type === 'talks') as TalksTimeSlot[]

    const timeslottedTalks: TimeslottedTalk[] = talkTimeslots.flatMap(timeslot => {
        return timeslot.talks.map(talk => ({
            ...talk,
            start: timeslot.start,
            end: timeslot.end
        }))
    })

    return timeslottedTalks;
}
