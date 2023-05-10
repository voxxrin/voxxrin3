<template>
  <ion-accordion :value="timeslot.id.value" :class="{ [`_${progress?.status}`]: true, '_feedback-provided': !!timeslotFeedback, '_missing-feedback': !timeslotFeedback, '_is-break': timeslot.type==='break' }">
    <ion-item slot="header" color="light">
      <ion-grid class="slot">
        <ion-row>
          <ion-col class="slot-schedule">
            <ion-icon class="_accordion-icon _ongoing-icon" aria-hidden="true" src="assets/icons/solid/timer.svg"></ion-icon>
            <ion-icon class="_accordion-icon _past-icon" aria-hidden="true" src="assets/icons/solid/backward-circle.svg"></ion-icon>
            <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" src="assets/icons/solid/clock.svg"></ion-icon>
            <ion-label>{{timeslotLabel.start}} <ion-icon aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon> {{timeslotLabel.end}}</ion-label>
            <ion-badge v-if="timeslot.type==='talks' && timeslot.overlappingTimeSlots.length > 0">{{LL.Overlaps_x_slot({nrOfOverlappingSlots: timeslot.overlappingTimeSlots.length})}}</ion-badge>
          </ion-col>
          <ion-col class="slot-actions" size="auto">
            <ion-progress-bar class="_ongoing-progress" v-if="progress?.status === 'ongoing'" :value="progress.progressInPercent / 100"></ion-progress-bar>
            <ion-icon class="_provided-feedback" aria-hidden="true" src="/assets/icons/solid/comment-check.svg"></ion-icon>
            <ion-button class="_missing-feedback">
              <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-item>

    <div class="ion-padding accordion-content" slot="content">
      <schedule-break v-if="timeslot.type==='break'" :event="event" :talk-break="timeslot.break"></schedule-break>
      <talk-format-groups-breakdown v-if="timeslot.type==='talks'" :event="event" :talks="timeslot.talks"></talk-format-groups-breakdown>
    </div>
  </ion-accordion>
</template>

<script setup lang="ts">
import {PropType, ref} from "vue";
import {
  IonProgressBar,
  IonAccordion,
  IonRow,
  IonCol,
  IonGrid,
  IonBadge
} from '@ionic/vue';
import {
  getTimeslotLabel,
  getTimeslotTimingProgress,
  TimeslotTimingProgress,
  VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {useInterval} from "@/views/vue-utils";
import {useCurrentClock} from "@/state/CurrentClock";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import TalkFormatGroupsBreakdown from "@/components/TalkFormatGroupsBreakdown.vue";
import ScheduleBreak from "@/components/ScheduleBreak.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";

const props = defineProps({
  timeslot: {
    required: true,
    type: Object as PropType<VoxxrinScheduleTimeSlot>
  },
  timeslotFeedback: {
    required: false,
    type: Object as PropType<VoxxrinTimeslotFeedback|undefined>
  },
  event: {
    required: true,
    type: Object as PropType<VoxxrinConferenceDescriptor>
  }
})

const { LL } = typesafeI18n()

const progress = ref<TimeslotTimingProgress>()
useInterval(() => {
  if(props.timeslot) {
    progress.value = getTimeslotTimingProgress(props.timeslot, useCurrentClock().zonedDateTimeISO())
  }
}, import.meta.env.DEV?{seconds:4}:{minutes:1}, { immediate: true });

const timeslotLabel = getTimeslotLabel(props.timeslot!);

</script>

<style lang="scss" scoped>

ion-accordion {
  border-bottom: 2px solid var(--app-background);

  &.accordion-expanded {
    border-bottom: none;
  }

  .accordion-content {
    background: var(--app-background);
    padding-top: 0;
    padding-bottom: 0;
    padding-inline-start: 0;
    padding-inline-end: 0;

    ion-list {
      padding: 0 var(--app-gutters);
      background: var(--app-background);
    }
  }

  ._accordion-icon, ._missing-feedback, ._provided-feedback, ._ongoing-progress {
    display: none;
  }

  ._provided-feedback {
    width: 48px;
    font-size: 30px;
    color: var(--app-beige-dark);
  }

  ion-item {
    position: sticky;
    top: 98px;
    --padding-start: 8px;
    --padding-end: 0;
    --border-width: 0;

    .slot {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0;

      ion-row {
        height: 100%;
        width: 100%;
      }

      &-schedule {
        display: flex;
        align-items: center;
        column-gap: 8px;

        ._accordion-icon {
          font-size: 22px;
          color: var(--app-primary-shade);
        }
      }

      &-actions {
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0;
        margin-right: 12px;
      }
    }

    .slotCollapse {
      height: 100%;
    }

    ion-label {
      display: flex !important;
      align-items: center;
      font-weight: bold;
    }

    ._missing-feedback {
      height: 100%;
      --background: var(--app-theme-hightlight);
      --box-shadow: none;
      --border-radius: 0;
      --padding-start: 8px;
      --padding-end: 8px;
      font-size: 20px;
    }
  }

  // * States Accordion Divider *//
  &._past {
    .ion-color-light {
      --ion-color-base: var(--app-beige-line) !important;
      --ripple-color: var(--app-beige-dark) !important;

      ion-label { color: var(--app-primary-tint);}
    }

    ::v-deep .ion-accordion-toggle-icon {
      font-size: 24px;
      color: var(--app-beige-dark) !important;
    }

    ._accordion-icon._past-icon { display: inline-block; color: var(--app-primary-tint) }
    &._missing-feedback:not(._is-break) ._missing-feedback { display: inline-block;}
    &._feedback-provided:not(._is-break) ._provided-feedback {display: inline-block;}
  }

  &._ongoing {
    .ion-color-light {
      --ion-color-base:  var(--app-theme-primary) !important;;
      --ripple-color: var(--app-beige-dark) !important;

      ion-label { color: var(--app-white);}
    }

    ._accordion-icon._ongoing-icon { display: inline-block; }
    ._ongoing-progress { display: block; }

    ::v-deep .ion-accordion-toggle-icon {
      font-size: 24px;
      color: var(--app-white) !important;
    }

    ._accordion-icon { color: var(--app-white) !important;}
  }

  &._future {
    --color: var(--app-white);

    .ion-color-light {
      --ion-color-base: var(--app-primary-shade) !important;
      --ripple-color: var(--app-primary) !important;

      ion-label { color: var(--app-white);}
    }

    ::v-deep .ion-accordion-toggle-icon {
      font-size: 24px;
      color: var(--app-white) !important;
    }

    ._accordion-icon._future-icon { display: inline-block; }
    ._accordion-icon { color: var(--app-white) !important;}
  }
}
</style>
