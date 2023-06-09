<template>
  <ion-accordion :value="timeslot.id.value" :class="{ [`_${progress?.status}`]: true, '_feedback-provided': !!timeslotFeedback, '_missing-feedback': !timeslotFeedback, '_is-break': timeslot.type==='break' }">
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
            <div class="slotOverlay" v-if="timeslot.type==='talks' && timeslot.overlappingTimeSlots.length > 0">
              <ion-icon aria-hidden="true" src="assets/icons/solid/slot-overlay.svg"></ion-icon>
              <span class="slotOverlay-txt">
                <small>{{LL.Overlaps_x_slot_label()}}</small>
                <strong>{{LL.Overlaps_x_slot_value({nrOfOverlappingSlots: timeslot.overlappingTimeSlots.length})}}</strong>
              </span>
            </div>
          </ion-col>
          <ion-col class="slot-actions" size="auto">
            <ion-icon class="_provided-feedback" aria-hidden="true" src="/assets/icons/solid/comment-check.svg" v-if="areFeedbacksEnabled(event)"></ion-icon>
            <ion-button class="_missing-feedback" @click.stop="$emit('add-timeslot-feedback-clicked', timeslot)" v-if="areFeedbacksEnabled(event)">
              <ion-icon src="/assets/icons/line/comment-line-add.svg"></ion-icon>
            </ion-button>
          </ion-col>
          <ion-progress-bar class="_ongoing-progress" v-if="progress?.status === 'ongoing'" :value="progress.progressInPercent / 100"></ion-progress-bar>
        </ion-row>
      </ion-grid>
    </ion-item>

    <div class="ion-padding accordion-content" slot="content">
      <schedule-break v-if="timeslot.type==='break'" :event="event" :talk-break="timeslot.break"></schedule-break>
      <talk-format-groups-breakdown
          :event="event" v-if="timeslot.type==='talks'"
          :talks="timeslot.talks" @talkClicked="openTalkDetails($event)"
          :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite">
        <template #talk-card-upper-right="{ talk }">
          <div class="room" v-if="event.features.roomsDisplayed">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
            {{talk.room.title}}
          </div>
        </template>
        <template #talk-card-footer-actions="{ talk, talkNotesHook }">
          <div class="talkActions">
            <div class="talkActions-watchLater">
              <ion-button class="btnTalk watch-later-btn" @click.stop="() => talkNotesHook.toggleWatchLater()" v-if="conferenceDescriptor?.features.remindMeOnceVideosAreAvailableEnabled">
                <ion-icon v-if="!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
                <ion-icon v-if="!!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
              </ion-button>
            </div>
            <div class="talkActions-favorite">
              <ion-button class="btnTalk favorite-btn" @click.stop="() => talkNotesHook.toggleFavorite()" v-if="conferenceDescriptor?.features.favoritesEnabled">
                <span class="favorite-btn-group">
                  <ion-icon class="favorite-btn-group-icon" v-if="!talkNotesHook.talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
                  <ion-icon class="favorite-btn-group-icon" v-if="!!talkNotesHook.talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
                  <ion-label class="favorite-btn-group-nb" v-if="talkNotesHook.eventTalkStats !== undefined">{{ talkNotesHook.eventTalkStats.totalFavoritesCount }}</ion-label>
                </span>
              </ion-button>
            </div>
          </div>
        </template>
      </talk-format-groups-breakdown>
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
import TalkFormatGroupsBreakdown from "@/components/TalkFormatGroupsBreakdown.vue";
import ScheduleBreak from "@/components/ScheduleBreak.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    useSharedConferenceDescriptor
} from "@/state/useConferenceDescriptor";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";

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

defineEmits<{
    (e: 'add-timeslot-feedback-clicked', timeSlot: VoxxrinScheduleTimeSlot): void
}>()

const { LL } = typesafeI18n()

const { conferenceDescriptor } = useSharedConferenceDescriptor(props.event?.id);

const progress = ref<TimeslotTimingProgress>()
useInterval(() => {
  if(props.timeslot) {
    progress.value = getTimeslotTimingProgress(props.timeslot, useCurrentClock().zonedDateTimeISO())
  }
}, {seconds:5}, { immediate: true });

const timeslotLabel = getTimeslotLabel(props.timeslot!);

const { triggerTabbedPageNavigate } = useTabbedPageNav();

function openTalkDetails(talk: VoxxrinTalk) {
    if(props.event && talk) {
        triggerTabbedPageNavigate(`/events/${props.event.id.value}/talks/${talk.id.value}/details`, "forward", "push");
    }
}
</script>

<style lang="scss" scoped>
  // * Base Style Accordion *//
  ion-accordion {
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
      width: 116px;
      z-index: -1;
      --progress-background: rgba(var(--ion-color-light-rgb), 0.4);
      border: 1px solid rgba(var(--ion-color-light-rgb), 0.6);
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

        .slotOverlay {
          display: flex;
          align-items: center;
          column-gap: 4px;
          padding: 2px 8px 2px 4px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          background-color: white;
          color: var(--voxxrin-event-theme-colors-secondary-hex);

          ion-icon {
            font-size: 16px;
          }

          &-txt {
            display: flex;
            flex-direction: column;
            line-height: 0.9;

            small {
              opacity: 0.8;
            }
          }
        }

        &-actions {
          display: flex;
          align-items: center;
          height: 100%;
          width: 44px !important;
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

    // * States Accordion Divider *//
    &._past {
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

    &._ongoing {
      .ion-color-light {
        --ion-color-base:  var(--voxxrin-event-theme-colors-primary-hex) !important;;
        --ripple-color: var(--app-beige-dark) !important;

        ion-label { color: var(--app-white);}
      }

      ._accordion-icon._ongoing-icon { display: inline-block; }
      ._ongoing-progress { display: block; }
      ._accordion-icon { color: var(--app-white) !important;}
    }

    &._future {
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
    }
  }

  //* Base style slot actions *//
  .talkActions {
    display: flex;
    flex-direction: row;

    &-watchLater, &-favorite { height: 100%;}

    .btnTalk {
      height: 100% !important;
      min-height: 55px !important;
      width: 58px !important;
      margin: 0;
      --border-radius: 0;
      --background: rgba(white, 0.5);
      --color: var(--app-primary);
      border-left: 1px solid var(--app-grey-line);
      font-size: 20px;
      --padding-start: 0;
      --padding-end: 0;
      --background-activated-opacity: 0.1;
      --background-hover-opacity: 0.1;
      --box-shadow: none;

      @media (prefers-color-scheme: dark) {
        --background: rgba(white, 0.2);
        --color: var(--app-white);
        border-left: 1px solid var(--app-line-contrast);
      }

      .favorite-btn {
        --size: 28px;

        &-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          row-gap: 4px;

          &-icon {
            position: relative;
            font-size: 26px;
          }

          &-nb {
            font-size: 14px;
            font-weight: 700;
          }
        }
      }
    }

    &-actions {
      display: flex;
      align-items: end;
    }
  }
</style>
