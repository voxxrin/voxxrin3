import {computed, onMounted, Ref, unref, watch} from "vue";
import {
    createVoxxrinConferenceDescriptor, VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {EventId} from "@/models/VoxxrinEvent";
import {ConferenceDescriptor} from "../../../shared/conference-descriptor.firestore";
import {
    deferredVuefireUseDocument
} from "@/views/vue-utils";
import {collection, doc, DocumentReference} from "firebase/firestore";
import {db} from "@/state/firebase";
import {createSharedComposable} from "@vueuse/core";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import {useOverridenEventDescriptorProperties} from "@/state/useDevUtilities";
import {User} from "firebase/auth";
import {extractTalksFromSchedule, VoxxrinDailySchedule} from "@/models/VoxxrinSchedule";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {checkCache, preloadPicture} from "@/services/Cachings";
import {Temporal} from "temporal-polyfill";
import {CompletablePromiseQueue} from "@/models/utils";
import {prepareSchedules} from "@/state/useSchedule";
import {typesafeI18n} from "@/i18n/i18n-vue";

function getConferenceDescriptorDoc(eventId: EventId|undefined) {
    if(!eventId || !eventId.value) {
        return undefined;
    }

    return doc(collection(doc(collection(db, 'events'), eventId.value), 'event-descriptor'), 'self') as DocumentReference<ConferenceDescriptor & {__initialId: string}>;;
}
export function useConferenceDescriptor(
    eventIdRef: Ref<EventId | undefined>) {

    const overridenEventDescriptorPropertiesRef = useOverridenEventDescriptorProperties();

    PERF_LOGGER.debug(() => `useConferenceDescriptor(${unref(eventIdRef)?.value})`)
    watch(() => unref(eventIdRef), (newVal, oldVal) => {
        PERF_LOGGER.debug(() => `useConferenceDescriptor[eventIdRef] updated from [${oldVal?.value}] to [${newVal?.value}]`)
    }, {immediate: true})

    const firestoreConferenceDescriptorRef = deferredVuefireUseDocument([eventIdRef],
        ([eventId]) => getConferenceDescriptorDoc(eventId));

    return {
        conferenceDescriptor: computed(() => {
            const firestoreConferenceDescriptor = unref(firestoreConferenceDescriptorRef),
                overridenEventDescriptorProperties = unref(overridenEventDescriptorPropertiesRef);


            if(!firestoreConferenceDescriptor) {
                return undefined;
            }

            const confDescriptor = createVoxxrinConferenceDescriptor({
                ...firestoreConferenceDescriptor,
                ...overridenEventDescriptorProperties,
                // firestore's document key always overrides document's data().id field (if it exists)
                // In our case for event-descriptor, document key and document.id are going to be different, that's
                // why we want to re-set firestoreConferenceDescriptor.id to initial firestore document's id
                //
                // See https://github.com/vuejs/vuefire/issues/558
                // and https://github.com/vueuse/vueuse/issues/2033#issuecomment-1549922919
                id: firestoreConferenceDescriptor.__initialId
            })
            return confDescriptor;
        })
    };
}

export const useSharedConferenceDescriptor = createSharedComposable(useConferenceDescriptor);


async function prepareEventInfos(user: User, confDescriptor: VoxxrinConferenceDescriptor, promisesQueue: CompletablePromiseQueue) {
  PERF_LOGGER.debug(() => `prepareEventInfos(userId=${user.uid}, eventId=${confDescriptor.id.value})`);

  await checkCache(`offlineEventInfos(eventId=${confDescriptor.id.value})(floorPlans)`, Temporal.Duration.from({ hours: 6 }), async () => {
    PERF_LOGGER.debug(() => `offlineEventInfos(eventId=${confDescriptor.id.value})(floorPlans)`)
    promisesQueue.addAll(
      (confDescriptor.infos?.floorPlans || [])
        .map(floorPlan => () => preloadPicture(floorPlan.pictureUrl)
        ),{ priority: 1000 })
  });

  await checkCache(`offlineEventInfos(eventId=${confDescriptor.id.value})(sponsorships)`, Temporal.Duration.from({ hours: 24 }), async () => {
    PERF_LOGGER.debug(() => `offlineEventInfos(eventId=${confDescriptor.id.value})(sponsorships)`)
    const sponsorships = (confDescriptor.infos?.sponsors || [])
      .reduce(
        (sponsorships, sponsorType) => sponsorships.concat(...sponsorType.sponsorships),
        [] as Array<{logoUrl: string}>
      );

    promisesQueue.addAll(
      sponsorships.map(sponsorship => () => preloadPicture(sponsorship.logoUrl)
      ),{ priority: 1000 })
  });
}

export function useOfflineEventPreparation(
  userRef: Ref<User|null|undefined>,
  confDescriptorRef: Ref<VoxxrinConferenceDescriptor | undefined>,
  currentScheduleRef: Ref<VoxxrinDailySchedule | undefined>,
  availableDaysRef: Ref<VoxxrinDay[]|undefined>,
  preparingOfflineScheduleToastMessageRef: Ref<string | undefined>,
  preparingOfflineScheduleToastIsOpenRef: Ref<boolean>,
) {

  const {LL} = typesafeI18n()
  return new Promise(resolve => {
    const LOGGER = Logger.named("useOfflineEventPreparation");

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

          await checkCache(`useOfflineEventPreparation(eventId=${confDescriptor.id.value})`, Temporal.Duration.from({ hours: 6 }), async () => {
            return new Promise(async schedulePreparationResolved => {
              const otherDayIds = availableDays.filter(availableDay => !availableDay.id.isSameThan(currentSchedule.day)).map(d => d.id);
              LOGGER.info(() => `Preparing schedule data for other days than currently selected one (${otherDayIds.map(id => id.value).join(", ")})`)

              const promisesQueue = new CompletablePromiseQueue({ concurrency: 20 })

              const progressInterval = setInterval(() => {
                preparingOfflineScheduleToastMessageRef.value = `${LL.value.Preloading_event_assets_for_offline_usage()}: <u>${promisesQueue.completed} / ${promisesQueue.total}</u>...<br/><em>${LL.value.This_can_slow_down_the_app_a_little_bit_during_pre_loading()}...</em>`
              }, 500)

              preparingOfflineScheduleToastIsOpenRef.value = true
              promisesQueue.on('idle', () => {
                const duration = Math.round((Date.now() - promisesQueue.creationDate.getTime())/10)/100;
                LOGGER.info(`Total offline promises loaded: ${promisesQueue.total} (duration: ${duration}s)`)
                preparingOfflineScheduleToastIsOpenRef.value = false
                clearInterval(progressInterval)
                schedulePreparationResolved();
              })

              await prepareEventInfos(user, confDescriptor, promisesQueue)
              await prepareSchedules(user, confDescriptor, currentSchedule.day, extractTalksFromSchedule(currentSchedule), otherDayIds, promisesQueue);

              // adding a "fake" promise queue task so that we trigger the 'idle' event above if no task is added to the queue
              // during prepare* functions above...
              promisesQueue.add(() => new Promise(resolve => setTimeout(resolve, 500)))
            })
          });

          resolve(null);
        }
      })
    })
  })
}
