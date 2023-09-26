import {EventId} from "@/models/VoxxrinEvent";
import {Ref, toValue, unref} from "vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import {
    collection,
    doc,
    DocumentReference, setDoc, updateDoc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {createSharedComposable} from "@vueuse/core";
import {
    Unreffable,
    deferredVuefireUseDocument
} from "@/views/vue-utils";
import {DayId} from "@/models/VoxxrinDay";
import {
    ProvidedUserFeedback, SkippedUserFeedback,
    UserDailyFeedbacks,
    UserFeedback
} from "../../../shared/feedbacks.firestore";
import {ScheduleTimeSlotId} from "@/models/VoxxrinSchedule";
import {useCurrentClock} from "@/state/useCurrentClock";
import {ISODatetime} from "../../../shared/type-utils";
import {match} from "ts-pattern";
import {User} from "firebase/auth";

function getUserFeedbacksSourceDoc(user: User|undefined|null, eventId: EventId|undefined, dayId: DayId|undefined) {
    if(!user || !eventId || !eventId.value || !dayId || !dayId.value) {
        return undefined;
    }
    return doc(collection(doc(collection(doc(collection(doc(collection(db,
                    'users'), user.uid),
                'events'), eventId.value),
            'days'), dayId.value),
        'feedbacks'), 'self'
    ) as DocumentReference<UserDailyFeedbacks>;
}
export function useUserFeedbacks(
    eventIdRef: Ref<EventId|undefined>,
    dayIdRef: Ref<DayId|undefined>
) {

    const userRef = useCurrentUser()

    const firestoreDailyUserFeedbacksRef = deferredVuefireUseDocument([userRef, eventIdRef, dayIdRef],
        ([user, eventId, dayId]) => getUserFeedbacksSourceDoc(user, eventId, dayId));

    const updateTimeslotFeedback = async (timeslotIdRef: Unreffable<ScheduleTimeSlotId>, feedback: Omit<UserFeedback, 'createdOn'|'lastUpdatedOn'>) => {
        const clock = useCurrentClock()

        const user = toValue(userRef),
            eventId = toValue(eventIdRef),
            timeslotId = unref(timeslotIdRef),
            dayId = toValue(dayIdRef),
            firestoreDailyUserFeedbacks = unref(firestoreDailyUserFeedbacksRef);

        const firestoreUserFeedbacksDoc = getUserFeedbacksSourceDoc(user, eventId, dayId);

        if(!firestoreUserFeedbacksDoc || !dayId) {
            return;
        }

        const now = clock.zonedDateTimeISO().toInstant().toString() as ISODatetime;
        const userFeedback: UserFeedback = match(feedback)
            .with({status:'provided'}, (providedFeedback: ProvidedUserFeedback): ProvidedUserFeedback => ({
                ...providedFeedback,
                createdOn: now,
                lastUpdatedOn: now,
                timeslotId: timeslotId.value,
                talkId: providedFeedback.talkId,
            })).with({status: 'skipped'}, (skippedFeedback: SkippedUserFeedback): SkippedUserFeedback => ({
                ...skippedFeedback,
                createdOn: now,
                lastUpdatedOn: now,
                timeslotId: timeslotId.value,
            })).run();

        if(!firestoreDailyUserFeedbacks) {
            await setDoc(firestoreUserFeedbacksDoc, {
                dayId: dayId.value,
                feedbacks: [userFeedback]
            })
        } else {
            let existingFeedbackIndex = firestoreDailyUserFeedbacks.feedbacks.findIndex(feedback => {
                return feedback.timeslotId === timeslotId.value;
            })

            if(existingFeedbackIndex === -1) {
                firestoreDailyUserFeedbacks.feedbacks.push(userFeedback)
            } else {
                firestoreDailyUserFeedbacks.feedbacks[existingFeedbackIndex] = {
                    ...userFeedback,
                    createdOn: firestoreDailyUserFeedbacks.feedbacks[existingFeedbackIndex].createdOn,
                }
            }
            await updateDoc(firestoreUserFeedbacksDoc, firestoreDailyUserFeedbacks);
        }
    }

    return {
        userFeedbacks: firestoreDailyUserFeedbacksRef,
        updateTimeslotFeedback
    };
}

export const useSharedUserFeedbacks = createSharedComposable(useUserFeedbacks);
