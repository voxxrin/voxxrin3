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
import {prepareEventTalks} from "@/state/useEventTalk";
import {prepareTalkStats} from "@/state/useEventTalkStats";
import {prepareUserTalkNotes} from "@/state/useUserTalkNotes";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {UserDailyFeedbacks} from "../../../shared/feedbacks.firestore";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import { User } from 'firebase/auth';
import {CompletablePromiseQueue} from "@/models/utils";
import {match} from "ts-pattern";

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

const IN_MEMORY_SPEAKER_URL_PRELOADINGS = new Set<string>();
async function loadTalkSpeakerUrls(
  talk: { speakers: Array<{ photoUrl?: VoxxrinTalk['speakers'][number]['photoUrl'] }> },
  promisesQueue: CompletablePromiseQueue
) {
    const LOGGER = Logger.named("loadTalkSpeakerUrls");

    promisesQueue.addAll(talk.speakers.map(speaker => {
      return async () => new Promise(resolve => {
        if (speaker.photoUrl) {
          if(IN_MEMORY_SPEAKER_URL_PRELOADINGS.has(speaker.photoUrl)) {
            LOGGER.debug(`Speaker url already preloaded, skipping: ${speaker.photoUrl}`)
            resolve(null);
          } else {
            IN_MEMORY_SPEAKER_URL_PRELOADINGS.add(speaker.photoUrl);

            const avatarImage = new Image();
            avatarImage.src = speaker.photoUrl;

            avatarImage.onload = resolve;
          }
        } else {
          resolve(null);
        }
      });
    }), { priority: 1 }); // Low priority because if we're not getting speaker image, that's not dramatic
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
    PERF_LOGGER.debug(() => `prepareSchedules(userId=${user.uid}, eventId=${conferenceDescriptor.id.value}, currentDayId=${currentDayId.value}, currentTalkIds=${JSON.stringify(currentTalks.map(talk => talk.id.value))}, otherDayIds=${JSON.stringify(otherDayIds.map(id => id.value))})`);

    promisesQueue.addAll([currentDayId, ...otherDayIds].map((dayId) => {
        return async () => {
          const talkIds: TalkId[]|undefined = await match(dayId === currentDayId)
            .with(true, async () => {
              currentTalks.forEach(talk => {
                loadTalkSpeakerUrls(talk, promisesQueue);
              })

              return currentTalks.map(talk => talk.id);
            }).otherwise(async () => {
              const dailyScheduleDoc = dailyScheduleDocument(conferenceDescriptor, dayId)

              if(navigator.onLine && dailyScheduleDoc) {
                const dailyScheduleSnapshot = await getDoc(dailyScheduleDoc);
                PERF_LOGGER.debug(`getDoc(${dailyScheduleDoc.path})`)

                return dailyScheduleSnapshot.data()?.timeSlots.reduce((talkIds, timeslot) => {
                  if (timeslot.type === 'talks') {
                    timeslot.talks.forEach(talk => {
                      loadTalkSpeakerUrls(talk, promisesQueue);

                      talkIds.push(new TalkId(talk.id))
                    })
                  }

                  return talkIds;
                }, [] as Array<TalkId>) || [];
              } else {
                return undefined;
              }
            })

          if(navigator.onLine && talkIds) {
            // Removing talk ids duplicates (for instance, on overflows)
            const uniqueTalkIds = Array.from(
              new Set(talkIds.map(t => t.value))
            ).map(rawTalkId => new TalkId(rawTalkId));

            if(dayId !== currentDayId) {
              promisesQueue.add(() => prepareTalkStats(conferenceDescriptor.id, dayId, uniqueTalkIds, promisesQueue), { priority: 100 })
              promisesQueue.add(() => prepareUserTalkNotes(user, conferenceDescriptor.id, dayId, uniqueTalkIds, promisesQueue), { priority: 100 });
            }

            promisesQueue.add(() => prepareEventTalks(conferenceDescriptor, dayId, uniqueTalkIds, promisesQueue), { priority: 100 });
          }
        }
    }), { priority: 1000 });
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
