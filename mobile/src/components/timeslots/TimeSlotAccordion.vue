<template>
  <ion-accordion :value="timeslot.id.value"
       :style="{ 'animation-delay': `${animationDelay}ms` }"
       :class="{ 'slot-accordion': true, [`_chronological_status_is_${progress?.status}`]: true, '_feedback-provided': !hasMissingFeedback, '_missing-feedback': hasMissingFeedback, '_is-break': timeslot.type==='break' }">
    <ion-item slot="header" color="light">
      <ion-ripple-effect type="bounded"></ion-ripple-effect>
      <ion-grid class="slot">
        <ion-row>
          <ion-col class="slot-schedule">
            <ion-icon class="_accordion-icon _ongoing-icon" aria-hidden="true" src="assets/icons/solid/timer.svg"></ion-icon>
            <ion-icon class="_accordion-icon _past-icon" aria-hidden="true" src="assets/icons/solid/backward-circle.svg"></ion-icon>
            <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" src="assets/icons/solid/clock.svg"></ion-icon>
            <ion-label>
              <span class="slot-schedule-start">{{timeslotLabel.start}}</span>
              <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              <span class="slot-schedule-end">{{timeslotLabel.end}}</span>
            </ion-label>
            <slot-overlaps v-if="timeslot.type === 'talks'" :overlappingTimeslots="timeslot.overlappingTimeSlots"></slot-overlaps>
          </ion-col>
          <ion-col class="slot-actions" size="auto">
            <ion-icon class="_provided-feedback" aria-hidden="true" src="/assets/icons/solid/comment-check.svg" v-if="areFeedbacksEnabled(confDescriptor)"></ion-icon>
            <ion-button class="_missing-feedback" v-if="elementsShown.includes('add-feedback-btn') && areFeedbacksEnabled(confDescriptor)"
                        @click.stop="$emit('add-timeslot-feedback-clicked', timeslot)">
              <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
            </ion-button>
          </ion-col>
          <ion-progress-bar class="_ongoing-progress" v-if="progress?.status === 'ongoing'" :value="progress.progressInPercent / 100"></ion-progress-bar>
        </ion-row>
      </ion-grid>
    </ion-item>

    <div class="ion-padding accordion-content" slot="content">
      <slot name="accordion-content" :timeslot="timeslot" :feedback="timeslotFeedback" :progressStatus="progress?.status" />
    </div>
  </ion-accordion>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {
  IonProgressBar,
  IonAccordion,
  IonRow,
  IonCol,
  IonGrid,
} from '@ionic/vue';
import {
  getTimeslotLabel,
  getTimeslotTimingProgress,
  TimeslotTimingProgress,
  VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
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

const props = defineProps({
  timeslot: {
    required: true,
    type: Object as PropType<VoxxrinScheduleTimeSlot>
  },
  timeslotFeedback: {
    required: true,
    type: Object as PropType<VoxxrinTimeslotFeedback>
  },
  confDescriptor: {
    required: true,
    type: Object as PropType<VoxxrinConferenceDescriptor>
  },
  progress: {
    required: false,
    type: Object as PropType<TimeslotTimingProgress|undefined>
  },
  elementsShown: {
      required: false,
      type: Object as PropType<Array<"add-feedback-btn">>,
      default: []
  },
  animationDelay: {
    required: false,
    type: Number as PropType<Number|undefined>,
    default: undefined
  }
})

defineEmits<{
    (e: 'add-timeslot-feedback-clicked', timeSlot: VoxxrinScheduleTimeSlot): void
}>()

const { LL } = typesafeI18n()

const { conferenceDescriptor } = useSharedConferenceDescriptor(toRef(() => props.confDescriptor?.id));

const timeslotLabel = getTimeslotLabel(props.timeslot!);

const hasMissingFeedback = computed(() => {
    return props.timeslotFeedback?.status === 'missing' || props.timeslotFeedback?.status === undefined;
})
</script>

<style lang="scss" scoped>
  // Hint: some .slot-accordion class are defined in _custom-ion-accordion.css and should have to be
  // moved here at some point

  // * Base Style Accordion *//
  ion-accordion {
    transition: var(--app-voxxrin-animations-timeslots-anim-duration);
    animation: scale-up-center var(--app-voxxrin-animations-timeslots-anim-duration) cubic-bezier(0.390, 0.575, 0.565, 1.000) both;

    border-bottom: 1px solid var(--app-background);

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

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
        opacity: 0.5;
      }
    }

    ._ongoing-progress {
      position: absolute;
      left: 28px;
      top: 50%;
      transform: translate(0, -50%);
      height: 24px;
      border-radius: 8px;
      width: 138px;
      z-index: -1;
      --progress-background: rgba(var(--ion-color-light-rgb), 0.4);
      border: 1px solid rgba(var(--ion-color-light-rgb), 0.6);
    }

    &._chronological_status_is_past {
      @media (prefers-color-scheme: dark) {
        border-bottom: 1px solid var(--app-light-contrast);
      }

      .ion-color-light {
        --ion-color-base: var(--app-beige-line) !important;
        --ripple-color: var(--app-beige-dark) !important;

        @media (prefers-color-scheme: dark) {
          --ion-color-base: var(--app-background) !important;
        }

        ion-label {
          color: var(--app-primary-tint);

          @media (prefers-color-scheme: dark) {
            color: var(--app-white);
          }
        }
      }

      ._accordion-icon._past-icon {
        display: inline-block;
        color: var(--app-primary-tint);

        @media (prefers-color-scheme: dark) {
          color: rgba(white, 0.5);
        }
      }
      &._missing-feedback:not(._is-break) ._missing-feedback { display: inline-block;}
      &._feedback-provided:not(._is-break) ._provided-feedback {display: inline-block;}
    }

    &._chronological_status_is_ongoing {
      .ion-color-light {
        --ion-color-base:  var(--voxxrin-event-theme-colors-primary-hex) !important;
        --ripple-color: var(--app-beige-dark) !important;

        ion-label { color: var(--app-white);}
      }

      ._accordion-icon._ongoing-icon { display: inline-block; }
      ._ongoing-progress { display: block; }
      ._accordion-icon { color: var(--app-white) !important;}

      .ion-accordion-toggle-icon {
        color: var(--app-white) !important;
      }

      &._missing-feedback:not(._is-break) ._missing-feedback { display: inline-block;}
      &._feedback-provided:not(._is-break) ._provided-feedback {display: inline-block;}
    }

    &._chronological_status_is_future {
      --color: var(--app-white);

      .ion-color-light {
        --ion-color-base: var(--app-primary-shade) !important;
        --ripple-color: var(--app-primary) !important;

        @media (prefers-color-scheme: dark) {
          --ion-color-base: var(--app-light-contrast) !important;
        }

        ion-label { color: var(--app-white);}
      }

      ._accordion-icon._future-icon { display: inline-block; }
      ._accordion-icon { color: var(--app-white) !important;}

      .ion-accordion-toggle-icon {
        color: var(--app-white) !important;

        @media (prefers-color-scheme: dark) {
          color: var(--app-medium-contrast);
        }
      }
    }

    ion-item {
      --padding-start: 0;
      --padding-end: 0;
      --border-width: 0;
      --inner-padding-end: 12px;

      .slot {
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0;

        ion-row {
          height: 100%;
          width: 100%;
        }

        &-date {
          position: absolute;
        }

        &-schedule {
          display: flex;
          align-items: center;
          column-gap: 6px;

          ._accordion-icon {
            font-size: 22px;
            color: var(--app-primary-shade);

            @media (prefers-color-scheme: dark) {
              color: var(--app-white);
            }
          }

          &-icon {
            width: 16px;
            font-size: 16px;
            opacity: 0.4;
          }

          &-start, &-end {
            width: 48px;
          }
        }

        &-actions {
          display: flex;
          align-items: center;
          height: 100%;
          width: fit-content;
          max-width: 44px !important;
          padding: 0;
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
        position: relative;
        --background: var(--voxxrin-event-theme-colors-secondary-hex);
        --box-shadow: none;
        --border-radius: 38px;
        width: 38px;
        margin-right: 0;
        --padding-start: 4px;
        --padding-end: 4px;
        font-size: 18px;

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }
    }
  }

  @keyframes scale-up-center {
    0% {
      opacity: 0;
      transform: scale(0.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

</style>
