import {EventId} from "@/models/VoxxrinEvent";
import {computed, unref} from "vue";
import {useCurrentUser, useDocument} from "vuefire";
import {
    collection,
    doc,
    DocumentReference, setDoc, updateDoc,
} from "firebase/firestore";
import {db} from "@/state/firebase";
import {createSharedComposable} from "@vueuse/core";
import {Unreffable} from "@/views/vue-utils";
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

export function useUserFeedbacks(
    eventIdRef: Unreffable<EventId|undefined>,
    dayIdRef: Unreffable<DayId|undefined>
) {

    const userRef = useCurrentUser()

    const firestoreUserFeedbacksSource = computed(() => {
        const user = unref(userRef),
            eventId = unref(eventIdRef),
            dayId = unref(dayIdRef);

        if(!user || !eventId || !dayId) {
            return undefined;
        }

        return doc(collection(doc(collection(doc(collection(doc(collection(db,
            'users'), user.uid),
            'events'), eventId.value),
            'days'), dayId.value),
            'feedbacks'), 'self'
        ) as DocumentReference<UserDailyFeedbacks>
    });

    const firestoreDailyUserFeedbacksRef = useDocument(firestoreUserFeedbacksSource);

    const updateTimeslotFeedback = async (timeslotIdRef: Unreffable<ScheduleTimeSlotId>, feedback: Omit<UserFeedback, 'createdOn'|'lastUpdatedOn'>) => {
        const clock = useCurrentClock()

        const firestoreUserFeedbacksDoc = unref(firestoreUserFeedbacksSource),
            timeslotId = unref(timeslotIdRef),
            dayId = unref(dayIdRef),
            firestoreDailyUserFeedbacks = unref(firestoreDailyUserFeedbacksRef);

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
