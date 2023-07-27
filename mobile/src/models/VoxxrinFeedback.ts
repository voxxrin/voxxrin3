
// TODO: To complete
import {ScheduleTimeSlotId} from "@/models/VoxxrinSchedule";
import {UserDailyFeedbacks, UserFeedback} from "../../../shared/feedbacks.firestore";
import {Replace} from "@/models/type-utils";
import {TalkId} from "@/models/VoxxrinTalk";

export type VoxxrinUserFeedback = Replace<UserFeedback, {
    timeslotId: ScheduleTimeSlotId,
    talkId: TalkId,
}>

export function findTimeslotFeedback(dailyUserFeedbacks: UserDailyFeedbacks|undefined, timeslotId: ScheduleTimeSlotId): VoxxrinUserFeedback|undefined {
    const timeslotFeedbacks = (dailyUserFeedbacks?.feedbacks || []).filter(f => f.timeslotId === timeslotId.value);
    const firestoreFeedback: UserFeedback|undefined = timeslotFeedbacks[0];
    if(!firestoreFeedback) {
        return undefined;
    }

    const feedback: VoxxrinUserFeedback = {
        ...firestoreFeedback,
        talkId: new TalkId(firestoreFeedback.talkId),
        timeslotId: new ScheduleTimeSlotId(firestoreFeedback.timeslotId),
    }

    return feedback;
}
