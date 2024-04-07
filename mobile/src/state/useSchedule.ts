import {computed, Ref, unref, watch} from "vue";
import {deferredVuefireUseDocument, managedRef as ref} from "@/views/vue-utils";
import {DailySchedule} from "../../../shared/daily-schedule.firestore";
import {
  createVoxxrinDailyScheduleFromFirestore, extractTalksFromSchedule,
  getTimeslotLabel, toFilteredLabelledTimeslotWithFeedback,
  VoxxrinDailySchedule,
  VoxxrinScheduleTimeSlot,
} from "@/models/VoxxrinSchedule";
import {DayId} from "@/models/VoxxrinDay";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DocumentReference, doc, collection, getDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {prepareEventTalk} from "@/state/useEventTalk";
import {prepareTalkStats} from "@/state/useEventTalkStats";
import {prepareUserTalkNotes} from "@/state/useUserTalkNotes";
import {
  createVoxxrinTalkFromFirestore,
  removeTalkOverflowsAndDuplicates,
  VoxxrinTalk
} from "@/models/VoxxrinTalk";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {UserDailyFeedbacks} from "../../../shared/feedbacks.firestore";
import {PERF_LOGGER} from "@/services/Logger";
import { User } from 'firebase/auth';
import {CompletablePromiseQueue} from "@/models/utils";
import {match, P} from "ts-pattern";
import {checkCache} from "@/services/Cachings";
import {Temporal} from "temporal-polyfill";

export function useSchedule(
            conferenceDescriptorRef: Ref<VoxxrinConferenceDescriptor | undefined>,
            dayIdRef: Ref<DayId | undefined>) {

    PERF_LOGGER.debug(() => `useSchedule(${unref(conferenceDescriptorRef)?.id.value}, ${unref(dayIdRef)?.value})`)
    watch(() => unref(conferenceDescriptorRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useSchedule[conferenceDescriptorRef] updated from [${oldVal?.id.value}] to [${newVal?.id.value}]`)
    }, {immediate: true})
    watch(() => unref(dayIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useSchedule[dayIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreDailyScheduleRef = deferredVuefireUseDocument([conferenceDescriptorRef, dayIdRef],
        ([conferenceDescriptor, dayId]) => dailyScheduleDocument(conferenceDescriptor, dayId));

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

export async function prepareDailySchedule(conferenceDescriptor: VoxxrinConferenceDescriptor, day: DayId, dailyTalks: VoxxrinTalk[], promisesQueue: CompletablePromiseQueue, queuePriority: number) {
  // Removing talk duplicates (for instance, overflows)
  const dedupedDailyTalks = removeTalkOverflowsAndDuplicates(dailyTalks);

  promisesQueue.addAll(dedupedDailyTalks.map(talk => () => prepareEventTalk(conferenceDescriptor, day, talk, promisesQueue, queuePriority)))
}

export async function
prepareSchedules(
    user: User,
    conferenceDescriptor: VoxxrinConferenceDescriptor,
    currentDayId: DayId,
    currentTalks: Array<VoxxrinTalk>,
    otherDayIds: Array<DayId>,
    promisesQueue: CompletablePromiseQueue
) {
    promisesQueue.add(() =>
      checkCache(`offlineSchedulePrep(eventId=${conferenceDescriptor.id.value})(currentDay (${currentDayId.value}))`,
        Temporal.Duration.from({ hours: 6 }), // Cache should be lower for current day than for other days
        async () => {
          PERF_LOGGER.debug(() => `offlineSchedulePrep(eventId=${conferenceDescriptor.id.value})(currentDay (${currentDayId.value}))`)
          await prepareDailySchedule(conferenceDescriptor, currentDayId, currentTalks, promisesQueue, 1000);
      }),
      {priority: 1000}
    );

    promisesQueue.addAll(otherDayIds.map(otherDayId => () =>
      checkCache(`offlineSchedulePrep(eventId=${conferenceDescriptor.id.value})(otherDay=${currentDayId.value})`,
        Temporal.Duration.from({ hours: 24 }), // Cache should be higher for other days than for current day
        async () => {
          PERF_LOGGER.debug(() => `offlineSchedulePrep(eventId=${conferenceDescriptor.id.value})(otherDay=${currentDayId.value})`)

          const maybeDailyScheduleDoc = dailyScheduleDocument(conferenceDescriptor, otherDayId)

          const otherDayTalks = await match([navigator.onLine, maybeDailyScheduleDoc])
            .with([true, P.nonNullable], async ([_, dailyScheduleDoc ]) => {
              const dailyScheduleSnapshot = await getDoc(dailyScheduleDoc);
              PERF_LOGGER.debug(`getDoc(${dailyScheduleDoc.path})`)

              return dailyScheduleSnapshot.data()?.timeSlots.reduce((talks, timeslot) => {
                if (timeslot.type === 'talks') {
                  timeslot.talks.forEach(talk => {
                    const voxxrinTalk = createVoxxrinTalkFromFirestore(conferenceDescriptor, talk)
                    talks.push(voxxrinTalk);
                  })
                }

                return talks;
              }, [] as Array<VoxxrinTalk>) || [];
            }).otherwise(async () => [] as VoxxrinTalk[]);

          const dedupedOtherDayTalks = removeTalkOverflowsAndDuplicates(otherDayTalks)

          // For other days, we also need to prepare talks stats & notes given that it won't have been de-facto
          // pre-loaded by user navigation
          promisesQueue.add(() => prepareTalkStats(conferenceDescriptor.id, otherDayId, dedupedOtherDayTalks, promisesQueue), { priority: 100 })
          promisesQueue.add(() => prepareUserTalkNotes(user, conferenceDescriptor.id, otherDayId, dedupedOtherDayTalks, promisesQueue), { priority: 100 });

          await prepareDailySchedule(conferenceDescriptor, otherDayId, otherDayTalks, promisesQueue, 100);
      })),
      {priority: 100}
    );
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
    const timeslotsRef = ref<LabelledTimeslotWithFeedback[]>([]) as Ref<LabelledTimeslotWithFeedback[]>;

    watch([dailyScheduleRef, searchTermsRef, dailyUserFeedbacksRef], ([dailySchedule, searchTerms, dailyUserFeedbacks]) => {
        if (dailySchedule) {
            timeslotsRef.value = toFilteredLabelledTimeslotWithFeedback(dailySchedule, dailyUserFeedbacks, searchTerms);
        }
    })

    return { timeslotsRef }
}
