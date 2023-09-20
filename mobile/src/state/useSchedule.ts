import {computed, Ref, unref, watch} from "vue";
import {managedRef as ref} from "@/views/vue-utils";
import {DailySchedule} from "../../../shared/daily-schedule.firestore";
import {
    createVoxxrinDailyScheduleFromFirestore,
    getTimeslotLabel,
    VoxxrinDailySchedule,
    VoxxrinScheduleTimeSlot,
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DocumentReference, doc, collection, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {Unreffable} from "@/views/vue-utils";
import {useDocument} from "vuefire";
import {prepareEventTalks} from "@/state/useEventTalk";
import {prepareTalkStats} from "@/state/useEventTalkStats";
import {prepareUserTalkNotes} from "@/state/useUserTalkNotes";
import {filterTalksMatching, TalkId} from "@/models/VoxxrinTalk";
import {findTimeslotFeedback, VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {UserDailyFeedbacks} from "../../../shared/feedbacks.firestore";
import {PERF_LOGGER} from "@/services/Logger";

export function useSchedule(
            conferenceDescriptorRef: Unreffable<VoxxrinConferenceDescriptor | undefined>,
            dayIdRef: Unreffable<DayId | undefined>) {

    PERF_LOGGER.debug(() => `useSchedule(${unref(conferenceDescriptorRef)?.id.value}, ${unref(dayIdRef)?.value})`)
    watch(() => unref(conferenceDescriptorRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useSchedule[conferenceDescriptorRef] updated from [${oldVal?.id.value}] to [${newVal?.id.value}]`)
    }, {immediate: true})
    watch(() => unref(dayIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useSchedule[dayIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreDailyScheduleSource = computed(() => {
        const conferenceDescriptor = unref(conferenceDescriptorRef),
            dayId = unref(dayIdRef);

        return dailyScheduleDocument(conferenceDescriptor, dayId);
    });

    const firestoreDailyScheduleRef = useDocument(firestoreDailyScheduleSource)

    return {
        schedule: computed(() => {
            const conferenceDescriptor = unref(conferenceDescriptorRef),
                firestoreDailySchedule = unref(firestoreDailyScheduleRef);

            if(!conferenceDescriptor || !firestoreDailySchedule) {
                return undefined;
            }

            const schedule = createVoxxrinDailyScheduleFromFirestore(conferenceDescriptor, firestoreDailySchedule)
            return schedule;
        })
    };
}

export function dailyScheduleDocument(eventDescriptor: VoxxrinConferenceDescriptor|undefined, dayId: DayId|undefined) {
    if(!eventDescriptor || !eventDescriptor.id || !eventDescriptor.id.value || !dayId || !dayId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(db, 'events'), eventDescriptor.id.value), 'days'), dayId.value) as DocumentReference<DailySchedule>;
}

export function prepareSchedules(
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    currentDayId: DayId,
    otherDayIds: Array<DayId>
) {
    [currentDayId, ...otherDayIds].forEach(async dayId => {
        if(dayId !== currentDayId) {
            useSchedule(conferenceDescriptor, dayId);
        }

        const dailyScheduleDoc = dailyScheduleDocument(conferenceDescriptor, dayId)
        if(navigator.onLine && dailyScheduleDoc) {
            const dailyScheduleSnapshot = await getDoc(dailyScheduleDoc);

            const dayAndTalkIds = dailyScheduleSnapshot.data()?.timeSlots.reduce((dayAndTalkIds, timeslot) => {
                if(timeslot.type === 'talks') {
                    timeslot.talks.forEach(talk => {
                        talk.speakers.forEach(speaker => {
                            if(speaker.photoUrl) {
                                const avatarImage = new Image();
                                avatarImage.src = speaker.photoUrl;
                            }
                            // avatarImage.onload = () => {
                            //     console.log(`Avatar ${speaker.photoUrl} pre-loaded !`)
                            // };
                        })

                        dayAndTalkIds.push({dayId, talkId: new TalkId(talk.id)})
                    })
                }

                return dayAndTalkIds;
            }, [] as Array<{dayId: DayId, talkId: TalkId}>) || [];

            prepareEventTalks(conferenceDescriptor, dayAndTalkIds.map(dat => dat.talkId));
            prepareTalkStats(conferenceDescriptor.id, dayAndTalkIds);
            prepareUserTalkNotes(conferenceDescriptor.id, dayAndTalkIds);
        }
    })
}

export type LabelledTimeslotWithFeedback = VoxxrinScheduleTimeSlot & {
    label: ReturnType<typeof getTimeslotLabel>,
    feedback: VoxxrinTimeslotFeedback
};

export function useLabelledTimeslotWithFeedbacks(
    dailyScheduleRef: Ref<VoxxrinDailySchedule|undefined>,
    dailyUserFeedbacksRef: Ref<UserDailyFeedbacks|undefined>,
    searchTermsRef: Ref<string|undefined>
) {
    const timeslotsRef = ref<LabelledTimeslotWithFeedback[]>([]);

    watch([dailyScheduleRef, searchTermsRef, dailyUserFeedbacksRef], ([dailySchedule, searchTerms, dailyUserFeedbacks]) => {
        if (dailySchedule) {
            timeslotsRef.value = dailySchedule.timeSlots.map((ts: VoxxrinScheduleTimeSlot): LabelledTimeslotWithFeedback => {
                const label = getTimeslotLabel(ts);
                if (ts.type === 'break') {
                    return {...ts, label, feedback: {status: 'missing'}};
                } else {
                    const feedback = findTimeslotFeedback(dailyUserFeedbacks, ts.id);
                    const filteredTalks = filterTalksMatching(ts.talks, searchTerms);
                    return {...ts, label, talks: filteredTalks, feedback};
                }
            }).filter(ts => ts.type === 'break' || (ts.type === 'talks' && ts.talks.length !== 0));
        }
    })

    return { timeslotsRef }
}
