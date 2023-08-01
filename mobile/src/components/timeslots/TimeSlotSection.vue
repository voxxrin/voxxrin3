<template>
  <fieldset :class="{ 'slot-accordion': true, [`_${progress?.status}`]: true, [`_timeslot-is-${timeslot.type}`]: true }">
    <legend>
      <span class="slot-schedule-start">{{timeslotLabel.start}}</span>
      <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
      <slot-overlaps v-if="timeslot.type === 'talks'" :overlappingTimeslots="timeslot.overlappingTimeSlots"></slot-overlaps>
      <span class="slot-schedule-end">{{timeslotLabel.end}}</span>
    </legend>
    <slot name="section-content" :timeslot="timeslot" />
  </fieldset>
</template>

<script setup lang="ts">
import {PropType, ref} from "vue";
import {
  getTimeslotLabel,
  getTimeslotTimingProgress,
  TimeslotTimingProgress,
  VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {useInterval} from "@/views/vue-utils";
import {useCurrentClock} from "@/state/useCurrentClock";
import {
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    useSharedConferenceDescriptor
} from "@/state/useConferenceDescriptor";
import SlotOverlaps from "@/components/schedule/SlotOverlaps.vue";

const props = defineProps({
  timeslot: {
    required: true,
    type: Object as PropType<VoxxrinScheduleTimeSlot>
  },
  confDescriptor: {
    required: true,
    type: Object as PropType<VoxxrinConferenceDescriptor>
  }
})

defineEmits<{
}>()

const { LL } = typesafeI18n()

const { conferenceDescriptor } = useSharedConferenceDescriptor(props.confDescriptor?.id);

const progress = ref<TimeslotTimingProgress>()
useInterval(() => {
  if(props.timeslot) {
    progress.value = getTimeslotTimingProgress(props.timeslot, useCurrentClock().zonedDateTimeISO())
  }
}, {seconds:5}, { immediate: true });

const timeslotLabel = getTimeslotLabel(props.timeslot!);
</script>

<style lang="scss" scoped>

</style>
