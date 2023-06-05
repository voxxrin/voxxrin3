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
import {UserDailyFeedbacks, UserFeedback} from "../../../shared/feedbacks.firestore";
import {ScheduleTimeSlotId} from "@/models/VoxxrinSchedule";
import {TalkId} from "@/models/VoxxrinTalk";

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

        return doc(collection(doc(collection(doc(collection(db,
            'users'), user.uid),
            'event-feedbacks'), eventId.value),
            'days'), dayId.value
        ) as DocumentReference<UserDailyFeedbacks>
    });

    const firestoreDailyUserFeedbacksRef = useDocument(firestoreUserFeedbacksSource);

    const updateTimeslotFeedback = (timeslotIdRef: Unreffable<ScheduleTimeSlotId>, talkIdRef: Unreffable<TalkId>, feedback: UserFeedback) => {
        const firestoreUserFeedbacksDoc = unref(firestoreUserFeedbacksSource),
            timeslotId = unref(timeslotIdRef),
            talkId = unref(talkIdRef),
            dayId = unref(dayIdRef),
            firestoreDailyUserFeedbacks = unref(firestoreDailyUserFeedbacksRef);

        if(!firestoreUserFeedbacksDoc || !talkId || !dayId) {
            return;
        }

        if(!firestoreDailyUserFeedbacks) {
            setDoc(firestoreUserFeedbacksDoc, {
                dayId: dayId.value,
                feedbacks: [{
                    ...feedback,
                    timeslotId: timeslotId.value,
                    talkId: talkId.value,
                }]
            })
        } else {
            let existingFeedbackIndex = firestoreDailyUserFeedbacks.feedbacks.findIndex(feedback => {
                return feedback.timeslotId === timeslotId.value;
            })

            if(existingFeedbackIndex === -1) {
                firestoreDailyUserFeedbacks.feedbacks.push({
                    ...feedback,
                    timeslotId: timeslotId.value,
                    talkId: talkId.value,
                })
            } else {
                firestoreDailyUserFeedbacks.feedbacks[existingFeedbackIndex] = {
                    ...feedback,
                    timeslotId: timeslotId.value,
                    talkId: talkId.value,
                }
            }
            updateDoc(firestoreUserFeedbacksDoc, firestoreDailyUserFeedbacks);
        }
    }

    return {
        userFeedbacks: firestoreDailyUserFeedbacksRef,
        updateTimeslotFeedback
    };
}

export const useSharedUserFeedbacks = createSharedComposable(useUserFeedbacks);
