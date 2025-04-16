import {
    ScheduleTimeSlotId,
    VoxxrinScheduleTalksTimeSlot,
    VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {
    ProvidedUserFeedback,
    UserDailyFeedbacks,
    UserFeedback
} from "@shared/feedbacks.firestore";
import {TalkId} from "@/models/VoxxrinTalk";
import {Replace} from "@shared/type-utils";

export type VoxxrinUserFeedback = Replace<ProvidedUserFeedback, {
    timeslotId: ScheduleTimeSlotId,
    talkId: TalkId,
}>

export type VoxxrinTimeslotFeedback = {
    status: "missing" | "skipped" | "provided-on-overlapping-timeslot"
} | {
    status: "provided",
    userFeedback: VoxxrinUserFeedback
}

export function findTimeslotFeedback(dailyUserFeedbacks: UserDailyFeedbacks|undefined, timeslotId: ScheduleTimeSlotId): VoxxrinTimeslotFeedback {
    const extractors: Array<{predicate: (f: UserFeedback, timeslotId: ScheduleTimeSlotId) => boolean, extractFeedbackFrom: (f: UserFeedback) => VoxxrinTimeslotFeedback}> = [{
        predicate: (f: UserFeedback) => f.status === 'provided' && f.timeslotId === timeslotId.value,
        extractFeedbackFrom: (feedback: UserFeedback) => {
            const firestoreFeedback = feedback as ProvidedUserFeedback;

            const userFeedback: VoxxrinUserFeedback = {
                ...firestoreFeedback,
                talkId: new TalkId(firestoreFeedback.talkId),
                timeslotId: new ScheduleTimeSlotId(firestoreFeedback.timeslotId),
            }

            return {
                status: "provided",
                userFeedback
            };
        }
    }, {
        predicate: (f: UserFeedback, timeslotId: ScheduleTimeSlotId) =>
            f.status === 'skipped'
            && (f.timeslotId === timeslotId.value || f.alsoConcernsOverlappingTimeslotIds.includes(timeslotId.value)),
        extractFeedbackFrom: (feedback: UserFeedback) => ({ status: "skipped" })
    }, {
        predicate: (f: UserFeedback, timeslotId: ScheduleTimeSlotId) =>  f.status === 'provided' && f.alsoConcernsOverlappingTimeslotIds.includes(timeslotId.value),
        extractFeedbackFrom: (feedback: UserFeedback) => ({ status: "provided-on-overlapping-timeslot" })
    }]

    for (const extractor of extractors) {
        const timeslotFeedback = (dailyUserFeedbacks?.feedbacks || []).find(f => extractor.predicate(f, timeslotId));
        if(timeslotFeedback) {
            return extractor.extractFeedbackFrom(timeslotFeedback);
        }
    }

    return { status: "missing" };
}

export function findTimeslotTalkMatchingFeedback(timeslot: VoxxrinScheduleTimeSlot, userFeedback: VoxxrinUserFeedback) {
    if(timeslot.type === 'break') {
        return undefined;
    }

    if(!timeslot.id.isSameThan(userFeedback.timeslotId)) {
        return undefined;
    }
    return timeslot.talks.find(t => t.id.isSameThan(userFeedback.talkId))
}
