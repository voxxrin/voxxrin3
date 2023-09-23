<template>
  <slot name="iterator" :timeslot="timeslot" :index="index"
        v-for="(timeslot, index) in timeslotsRef" :key="timeslot.id.value" />
</template>

<script setup lang="ts">
import {onMounted, PropType, unref, watch} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DayId} from "@/models/VoxxrinDay";
import {LabelledTimeslotWithFeedback, useLabelledTimeslotWithFeedbacks} from "@/state/useSchedule";
import {
    getTimeslotLabel,
    getTimeslotTimingProgress,
    VoxxrinDailySchedule,
    VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {useUserFeedbacks} from "@/state/useUserFeedbacks";
import {useCurrentClock} from "@/state/useCurrentClock";
import {useInterval} from "@/views/vue-utils";
import {findTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {filterTalksMatching} from "@/models/VoxxrinTalk";
import {PERF_LOGGER, Logger} from "@/services/Logger";

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

const { userFeedbacks: dailyUserFeedbacksRef  } = useUserFeedbacks(props.confDescriptor?.id, props.dayId)
const { timeslotsRef } = useLabelledTimeslotWithFeedbacks(
    toRef(props, 'dailySchedule'),
    dailyUserFeedbacksRef, toRef(props, 'searchTerms'));

export type MissingFeedbackPastTimeslot = {
    start: string,
    end: string,
    timeslot: VoxxrinScheduleTimeSlot
}
const missingFeedbacksPastTimeslotsRef = ref<MissingFeedbackPastTimeslot[]>([])

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
        timeslotsRef.value = dailySchedule.timeSlots.map((ts: VoxxrinScheduleTimeSlot): LabelledTimeslotWithFeedback => {
            const label = getTimeslotLabel(ts);
            if(ts.type === 'break') {
                return { ...ts, label, feedback: {status: 'missing'} };
            } else {
                const feedback = findTimeslotFeedback(dailyUserFeedbacks, ts.id);
                const filteredTalks = filterTalksMatching(ts.talks, searchTerms);
                return {...ts, label, talks: filteredTalks, feedback };
            }
        }).filter(ts => ts.type === 'break' || (ts.type === 'talks' && ts.talks.length !== 0));

        recomputeMissingFeedbacksList();
    }
}, {immediate: true});

watch([missingFeedbacksPastTimeslotsRef], ([missingFeedbacksPastTimeslots]) => {
    emit('missing-feedback-past-timeslots-updated', missingFeedbacksPastTimeslots)
})
function recomputeMissingFeedbacksList() {
    const timeslots = unref(timeslotsRef);
    if(!timeslots) {
        missingFeedbacksPastTimeslotsRef.value = [];
        return;
    }

    missingFeedbacksPastTimeslotsRef.value = timeslots.filter(ts => {
        return ts.type === 'talks'
            && ts.feedback.status === 'missing'
            && getTimeslotTimingProgress(ts, useCurrentClock().zonedDateTimeISO()).status === 'past'
    }).map(timeslot => {
        const labels = getTimeslotLabel(timeslot)
        return {timeslot, start: labels.start, end: labels.end };
    });
}

</script>

<style lang="scss" scoped>
</style>
