<template>
  <!--TODO #44 Add class _past _onGoing _future -->
  <div :class="{ 'slotSection _onGoing': true,[`_timeslot-is-${timeslot.type}`]: true }">
    <div class="slotSection-timeline">
      <span class="slot-schedule-start">{{timeslotLabel.start}}</span>
      <span class="slot-schedule-maillon">
          <!--TODO #44 Add condition for progress bar, and add dynamic height -->
          <div class="_ongoing-progress-vertical"></div>
      </span>
      <span class="slot-schedule-end">{{timeslotLabel.end}}</span>
      <slot-overlaps v-if="timeslot.type === 'talks'" :overlappingTimeslots="timeslot.overlappingTimeSlots"></slot-overlaps>
    </div>
    <div class="slotSection-content">
      <slot name="section-content" :timeslot="timeslot" />
      <!--TODO #44 Add btn feedback slot -->
      <ion-button class="_missing-feedback" v-if="true">
        <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {
  getTimeslotLabel,
  getTimeslotTimingProgress,
  TimeslotTimingProgress,
  VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {useInterval} from "@/views/vue-utils";
import {useCurrentClock} from "@/state/useCurrentClock";
import {
  areFeedbacksEnabled,
  VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    useSharedConferenceDescriptor
} from "@/state/useConferenceDescriptor";
import SlotOverlaps from "@/components/schedule/SlotOverlaps.vue";
import {IonProgressBar} from "@ionic/vue";

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

const { conferenceDescriptor } = useSharedConferenceDescriptor(toRef(() => props.confDescriptor?.id));

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
    width: 54px;
    padding: 16px 0 8px 0;
    border-bottom: 1px dashed var(--app-beige-dark);
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
      font-size: 14px;
      color:  var(--app-primary-dark);
    }

    .slot-schedule-maillon {
      position: relative;
      flex: 1;
      margin: 0 auto;
      width: 1px;
      height: 100%;
      border-left: 2px solid var(--voxxrin-event-theme-colors-primary-hex);

      &:after {
        position: absolute;
        top: 0;
        left: -10px;
        width: 10px;
        height: 10px;
        border-radius: 18px;
        border: 4px solid var(--app-beige-medium);
        background: var(--voxxrin-event-theme-colors-primary-hex);
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
        background: var(--voxxrin-event-theme-colors-primary-hex);
        content: '';

        @media (prefers-color-scheme: dark) {
          border: 4px solid var(--app-dark-contrast);
        }
      }
    }

    .slotOverlap {
      position: absolute;
      top: 50%;
      left: -10px;
      white-space: nowrap;
      transform: translate(0, -50%) rotate(-90deg);
      border: 2px solid var(--voxxrin-event-theme-colors-primary-hex);
    }
  }

  .slotSection-content {
    flex: 1;
    padding: 0 0 0 54px;
    border-bottom: 1px dashed var(--app-beige-line);

    ._missing-feedback {
      position: absolute;
      left: 52px;
      bottom: -4px;
      --background: var(--voxxrin-event-theme-colors-secondary-hex);
      --box-shadow: none;
      --border-radius: 0 16px 0 0;
      height: 38px;
      width: 38px;
      margin-right: 0;
      --padding-top: 4px;
      --padding-start: 4px;
      --padding-end: 8px;
      font-size: 18px;

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }
  }

  :deep(.listTalks) {
    padding-top: 4px;
    padding-bottom: 12px;
  }

  /* Stats Sections */
  &._past {
    .slotSection-timeline {
      background-color: var(--app-beige-line);
      color: var(--app-grey-dark);

      .slot-schedule-maillon {
        border-left: 2px dashed var(--app-grey-dark);

        &:after, &:before {
          border: 4px solid var(--app-beige-line);
          background-color: var(--app-beige-dark);
        }
      }
    }

    :deep(.listTalks) {background: none;}
  }

  &._onGoing {
    .slotSection-timeline {
      background-color: var(--voxxrin-event-theme-colors-primary-hex);
      color: var(--app-white);
      overflow: hidden;

      ._ongoing-progress-vertical {
        position: absolute;
        left: -15px;
        top: 0;
        height: 100%;
        border-radius: 24px;
        width: 28px;
        z-index: -1;
        opacity: 0.3;
        background-color: var(--app-white);
      }

      .slot-schedule-maillon {
        border-left: 2px solid var(--app-white);

        &:after, &:before {
          border: 4px solid var(--voxxrin-event-theme-colors-primary-hex);
          background-color: var(--app-white);
        }
      }
    }

    :deep(.listTalks) {background: none;}
  }

  &._future {
    .slotSection-timeline {
      background-color: var(--app-primary-shade);
      color: var(--app-white);
      overflow: hidden;

      .slot-schedule-maillon {
        border-left: 2px solid var(--app-white);

        &:after, &:before {
          border: 4px solid var(--app-primary-shade);
          background-color: var(--app-white);
        }
      }
    }
  }
}
</style>
