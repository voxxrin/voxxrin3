import {computed, onMounted, Ref, unref, watch} from "vue";
import {deferredVuefireUseDocument, managedRef as ref} from "@/views/vue-utils";
import {DailySchedule} from "../../../shared/daily-schedule.firestore";
import {
  createVoxxrinDailyScheduleFromFirestore, extractTalksFromSchedule,
  getTimeslotLabel, toFilteredLabelledTimeslotWithFeedback,
  VoxxrinDailySchedule,
  VoxxrinScheduleTimeSlot,
} from "@/models/VoxxrinSchedule";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
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


export function useOfflineSchedulePreparation(
  userRef: Ref<User|null|undefined>,
  confDescriptorRef: Ref<VoxxrinConferenceDescriptor | undefined>,
  currentScheduleRef: Ref<VoxxrinDailySchedule | undefined>,
  availableDaysRef: Ref<VoxxrinDay[]|undefined>,
  preparingOfflineScheduleToastMessageRef: Ref<string | undefined>,
  preparingOfflineScheduleToastIsOpenRef: Ref<boolean>,
) {

  return new Promise(resolve => {
    const LOGGER = Logger.named("useOfflineSchedulePreparation");

    onMounted(() => {
      const watchCleaner = watch([
        confDescriptorRef, userRef, currentScheduleRef, availableDaysRef,
      ], async ([
        confDescriptor, user, currentSchedule, availableDays,
      ]) => {
        // Pre-loading other days data in the background, for 2 main reasons :
        // - navigation to other days will be quickier
        // - if user switches to offline without navigating to these days, information will be in his cache anyway
        if(confDescriptor && user && currentSchedule && availableDays) {
          // stopping watcher as soon as possible
          watchCleaner();

          const otherDayIds = availableDays.filter(availableDay => !availableDay.id.isSameThan(currentSchedule.day)).map(d => d.id);
          LOGGER.info(() => `Preparing schedule data for other days than currently selected one (${otherDayIds.map(id => id.value).join(", ")})`)

          const promisesQueue = new CompletablePromiseQueue({ concurrency: 20 })

          const progressInterval = setInterval(() => {
            preparingOfflineScheduleToastMessageRef.value = `Preloading event assets for offline usage <u>${promisesQueue.completed} / ${promisesQueue.total}</u>...<br/><em>This can slow down the app a little bit during pre-loading...</em>`
          }, 500)

          preparingOfflineScheduleToastIsOpenRef.value = true
          promisesQueue.on('idle', () => {
            const duration = Math.round((Date.now() - promisesQueue.creationDate.getTime())/10)/100;
            LOGGER.info(`Total offline promises loaded: ${promisesQueue.total} (duration: ${duration}s)`)
            preparingOfflineScheduleToastIsOpenRef.value = false
            clearInterval(progressInterval)
            resolve(null);
          })

          promisesQueue.add(async () => {
            await prepareSchedules(user, confDescriptor, currentSchedule.day, extractTalksFromSchedule(currentSchedule), otherDayIds, promisesQueue);
          }, { priority: 1000 })
        }
      })
    })
  })
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
