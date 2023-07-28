<template>
  <slot name="iterator" :timeslot="timeslot"
        v-for="(timeslot) in timeslotsRef" :key="timeslot.id.value" />
</template>

<script setup lang="ts">
import {onMounted, PropType, ref, toRef, unref, watch} from "vue";
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
        type: Object as PropType<string|undefined>
    }
})

const emit = defineEmits<{
    (e: 'missing-feedback-past-timeslots-updated', missingFeedbackPastTimeslot: MissingFeedbackPastTimeslot[]): void
}>()

onMounted(async () => {
    console.log(`SchedulePage mounted !`)
    useInterval(recomputeMissingFeedbacksList, {seconds:10}, {immediate: true})
})

const { userFeedbacks: dailyUserFeedbacksRef  } = useUserFeedbacks(props.confDescriptor?.id, props.dayId)
const { timeslotsRef } = useLabelledTimeslotWithFeedbacks(
    toRef(props, 'dailySchedule'),
    dailyUserFeedbacksRef, toRef(props, 'searchTerms'));

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

export type MissingFeedbackPastTimeslot = {
    start: string,
    end: string,
    timeslot: VoxxrinScheduleTimeSlot
}

const missingFeedbacksPastTimeslotsRef = ref<MissingFeedbackPastTimeslot[]>([])
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
