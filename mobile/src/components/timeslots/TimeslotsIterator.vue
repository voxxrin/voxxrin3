<template>
  <slot name="iterator" :timeslot="timeslot" :index="index"
        v-for="(timeslot, index) in timeslotsRef" :key="timeslot.id.value"
        :progress="progressesByTimeslotId.get(timeslot.id.value)"
        :upcomingRawTalkIds="upcomingRawTalkIdsRef"
  />

  <no-results v-if="searchTerms && !timeslotsRef.length" illu-path="images/svg/illu-no-results-talk.svg">
    <template #title>{{ LL.No_talks_matching_search_terms() }}</template>
  </no-results>
</template>

<script setup lang="ts">
import {onMounted, PropType, Ref, toValue, watch} from "vue";
import {managedRef as ref, toManagedRef as toRef, useInterval} from "@/views/vue-utils";
import {spacedEventIdOf, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DayId} from "@/models/VoxxrinDay";
import {LabelledTimeslotWithFeedback, useLabelledTimeslotWithFeedbacks} from "@/state/useSchedule";
import {
  getTemporallyUpcomingTalkIds,
  getTimeslotLabel,
  getTimeslotTimingProgress,
  TimeslotTimingProgress,
  toFilteredLabelledTimeslotWithFeedback,
  VoxxrinDailySchedule,
  VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {useUserFeedbacks} from "@/state/useUserFeedbacks";
import {useCurrentClock, watchClock} from "@/state/useCurrentClock";
import {Logger, PERF_LOGGER} from "@/services/Logger";
import NoResults from "@/components/ui/NoResults.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {Temporal} from "temporal-polyfill";
import {TALK_COMPLETION_THRESHOLD} from "../../../../shared/constants/shared-constants.utils";

const LOGGER = Logger.named("TimeslotIterator");

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    dayId: {
        required: true,
        type: Object as PropType<DayId|undefined>
    },
    dailySchedule: {
        required: false,
        type: Object as PropType<VoxxrinDailySchedule|undefined>
    },
    searchTerms: {
        required: false,
        type: String as PropType<string|undefined>
    }
})

const emit = defineEmits<{
    (e: 'timeslots-list-updated', timeslots: LabelledTimeslotWithFeedback[]): void,
    (e: 'missing-feedback-past-timeslots-updated', missingFeedbackPastTimeslot: MissingFeedbackPastTimeslot[]): void
}>()

onMounted(async () => {
    PERF_LOGGER.debug(`SchedulePage mounted !`)
    useInterval(recomputeMissingFeedbacksList, {freq:"low-frequency"}, {immediate: true})
})

const { LL } = typesafeI18n()

const { userFeedbacks: dailyUserFeedbacksRef  } = useUserFeedbacks(toRef(() => spacedEventIdOf(props.confDescriptor)), toRef(() => props.dayId))
const { timeslotsRef } = useLabelledTimeslotWithFeedbacks(
    toRef(props, 'dailySchedule'),
    dailyUserFeedbacksRef, toRef(props, 'searchTerms'));

export type MissingFeedbackPastTimeslot = {
    start: string,
    end: string,
    timeslot: VoxxrinScheduleTimeSlot
}
const missingFeedbacksPastTimeslotsRef = ref<MissingFeedbackPastTimeslot[]>([]) as Ref<MissingFeedbackPastTimeslot[]>

watch([timeslotsRef], ([timeslots]) => {
    emit('timeslots-list-updated', timeslots);
})

watch([
    toRef(props, 'confDescriptor'),
    toRef(props, 'dailySchedule'),
    toRef(props, 'searchTerms'),
    dailyUserFeedbacksRef,
], ([confDescriptor, dailySchedule, searchTerms, dailyUserFeedbacks]) => {
    if(dailySchedule && confDescriptor) {
        timeslotsRef.value = toFilteredLabelledTimeslotWithFeedback(dailySchedule, dailyUserFeedbacks, searchTerms);

        recomputeMissingFeedbacksList();
    }
}, {immediate: true});

watch([missingFeedbacksPastTimeslotsRef], ([missingFeedbacksPastTimeslots]) => {
    emit('missing-feedback-past-timeslots-updated', missingFeedbacksPastTimeslots)
})
function recomputeMissingFeedbacksList() {
    const timeslots = toValue(timeslotsRef);
    if(!timeslots) {
        missingFeedbacksPastTimeslotsRef.value = [];
        return;
    }

    missingFeedbacksPastTimeslotsRef.value = timeslots.filter(ts => {
        return ts.type === 'talks'
            && ts.feedback.status === 'missing'
            && (getTimeslotTimingProgress(ts, useCurrentClock().zonedDateTimeISO()).status === 'past'
                || getTimeslotTimingProgress(ts, useCurrentClock().zonedDateTimeISO()).status === 'ongoing')

    }).map(timeslot => {
        const labels = getTimeslotLabel(timeslot)
        return {timeslot, start: labels.start, end: labels.end };
    });
}

const upcomingRawTalkIdsRef = ref([] as string[])
const progressesByTimeslotId = ref(new Map<string, TimeslotTimingProgress>())
function refreshTimeslotProgresses(timeslots: LabelledTimeslotWithFeedback[], now: Temporal.ZonedDateTime) {
    timeslots.forEach(timeslot => {
        progressesByTimeslotId.value.set(timeslot.id.value, getTimeslotTimingProgress(timeslot, now))
    })

    const upcomingTalkIds = getTemporallyUpcomingTalkIds(timeslots, now, TALK_COMPLETION_THRESHOLD);
    const upcomingRawTalkIds = Array.from(new Set(upcomingTalkIds.map(id => id.value))).sort()
    if(upcomingRawTalkIds.join(",") !== upcomingRawTalkIdsRef.value.join(",")) {
      upcomingRawTalkIdsRef.value = upcomingRawTalkIds;
    }
}
const nowRef = watchClock({ freq: "high-frequency" })
watch([timeslotsRef, nowRef], ([timeslots, now]) => {
  if(now) {
    refreshTimeslotProgresses(timeslots, now);
  }
})

</script>

<style lang="scss" scoped>
</style>
