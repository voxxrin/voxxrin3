<template>
  <div :class="{ 'slotSection': true,[`_timeslot-is-${timeslot.type}`]: true }">
    <div class="slotSection-timeline">
      <span class="slot-schedule-start">{{timeslotLabel.start}}</span>
      <span class="slot-schedule-maillon"></span>
      <span class="slot-schedule-end">{{timeslotLabel.end}}</span>
      <slot-overlaps v-if="timeslot.type === 'talks'" :overlappingTimeslots="timeslot.overlappingTimeSlots"></slot-overlaps>
    </div>
    <div class="slotSection-content">
      <slot name="section-content" :timeslot="timeslot" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {managedRef as ref} from "@/views/vue-utils";
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
}, {freq:"high-frequency"}, { immediate: true });

const timeslotLabel = getTimeslotLabel(props.timeslot!);
</script>

<style lang="scss" scoped>

.slotSection {
  position: relative;
  display: flex;

  .slotSection-timeline {
    position: absolute;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    column-gap: 16px;
    height: 100%;
    width: 64px;
    padding: 16px 0 8px 0;
    border-bottom: 1px dashed var(--app-beige-line);
    border-right: 1px solid var(--app-beige-line);
    background: var(--app-beige-medium);
    z-index: 2;

    @media (prefers-color-scheme: dark) {
      background: var(--app-dark-contrast);
      --color:  var(--app-white);
    }

    .slot-schedule-start,
    .slot-schedule-end {
      flex: 0 0 auto;
      margin: 2px 0;
      font-weight: bold;
      font-size: 15px;
      color:  var(--app-primary-dark);
    }

    .slot-schedule-maillon {
      position: relative;
      flex: 1;
      margin: 0 auto;
      width: 1px;
      height: 100%;
      border-left: 2px solid var(--voxxrin-event-theme-colors-secondary-hex);

      &:after {
        position: absolute;
        top: 0;
        left: -10px;
        width: 10px;
        height: 10px;
        border-radius: 18px;
        border: 4px solid var(--app-beige-medium);
        background: var(--voxxrin-event-theme-colors-secondary-hex);
        content: '';

        @media (prefers-color-scheme: dark) {
          border: 4px solid var(--app-dark-contrast);
        }
      }

      &:before {
        position: absolute;
        bottom: 0;
        left: -10px;
        width: 10px;
        height: 10px;
        border-radius: 18px;
        border: 4px solid var(--app-beige-medium);
        background: var(--voxxrin-event-theme-colors-secondary-hex);;
        content: '';

        @media (prefers-color-scheme: dark) {
          border: 4px solid var(--app-dark-contrast);
        }
      }
    }

    .slotOverlap {
      position: absolute;
      top: 50%;
      left: -4px;
      white-space: nowrap;
      transform: translate(0, -50%) rotate(-90deg);
      border: 2px solid var(--voxxrin-event-theme-colors-secondary-hex);
    }
  }

  .slotSection-content {
    flex: 1;
    padding: 0 0 0 64px;
    border-bottom: 1px dashed var(--app-beige-line);
  }

  :deep(.listTalks) {
    padding-top: 4px;
    padding-bottom: 12px;
  }


  /* Stats Sections */
  &._past {
    .slotSection-timeline {
      background-image: linear-gradient(45deg, #e6e6e6 25%, #dbdbdb 25%, #dbdbdb 50%, #e6e6e6 50%, #e6e6e6 75%, #dbdbdb 75%, #dbdbdb 100%);
      background-size: 11.31px 11.31px;
      color: var(--app-beige-dark);

      .slot-schedule-maillon {
        filter: grayscale(1);
        border-left: 2px dashed var(--voxxrin-event-theme-colors-secondary-hex);

        &:after, &:before {
          border-left: 2px dashed var(--app-beige-dark);
          border-color: var(--app-beige-dark);
        }
      }
    }

    :deep(.listTalks) {background: none;}

    .slotOverlap,
    .slotSection-content {
      filter: grayscale(1);
    }
  }
}
</style>
