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
import {checkCache} from "@/services/Cachings";
import {Temporal} from "temporal-polyfill";
import {CompletablePromiseQueue} from "@/models/utils";
import {prepareSchedules} from "@/state/useSchedule";

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


export function useOfflineEventPreparation(
  userRef: Ref<User|null|undefined>,
  confDescriptorRef: Ref<VoxxrinConferenceDescriptor | undefined>,
  currentScheduleRef: Ref<VoxxrinDailySchedule | undefined>,
  availableDaysRef: Ref<VoxxrinDay[]|undefined>,
  preparingOfflineScheduleToastMessageRef: Ref<string | undefined>,
  preparingOfflineScheduleToastIsOpenRef: Ref<boolean>,
) {

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
            return new Promise(schedulePreparationResolved => {
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
                schedulePreparationResolved();
              })

              promisesQueue.add(async () => {
                await prepareSchedules(user, confDescriptor, currentSchedule.day, extractTalksFromSchedule(currentSchedule), otherDayIds, promisesQueue);
              }, { priority: 1000 })
            })
          });

          resolve(null);
        }
      })
    })
  })
}
