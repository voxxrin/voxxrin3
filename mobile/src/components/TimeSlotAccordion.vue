<template>
  <ion-accordion :value="timeslot.id.value"
                 class="slot-accordion"
                 :class="{ [`_${progress?.status}`]: true, '_feedback-provided': !!timeslotFeedback, '_missing-feedback': !timeslotFeedback, '_is-break': timeslot.type==='break' }">
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
            <ion-icon class="_provided-feedback" aria-hidden="true" src="/assets/icons/solid/comment-check.svg"></ion-icon>
            <ion-button class="_missing-feedback" @click.stop="$emit('add-timeslot-feedback-clicked', timeslot)">
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
          <div class="room">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
            {{talk.room.title}}
          </div>
        </template>
        <template #talk-card-footer-actions="{ talk, talkNotesHook }">
          <div class="talkActions">
            <div class="talkActions-watchLater">
              <ion-button class="btnTalk btn-watchLater" @click.stop="() => talkNotesHook.toggleWatchLater()" v-if="conferenceDescriptor?.features.remindMeOnceVideosAreAvailableEnabled">
                <ion-icon v-if="!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
                <ion-icon v-if="!!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
              </ion-button>
            </div>
            <div class="talkActions-favorite">
              <ion-button class="btnTalk btn-favorite" @click.stop="() => talkNotesHook.toggleFavorite()" v-if="conferenceDescriptor?.features.favoritesEnabled">
                <span class="btn-favorite-group">
                  <ion-icon class="btn-favorite-group-icon" v-if="!talkNotesHook.talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
                  <ion-icon class="btn-favorite-group-icon" v-if="!!talkNotesHook.talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
                  <ion-label class="btn-favorite-group-nb" v-if="talkNotesHook.eventTalkStats !== undefined">{{ talkNotesHook.eventTalkStats.totalFavoritesCount }}</ion-label>
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
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import TalkFormatGroupsBreakdown from "@/components/TalkFormatGroupsBreakdown.vue";
import ScheduleBreak from "@/components/ScheduleBreak.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useConferenceDescriptor} from "@/state/useConferenceDescriptor";
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

const { conferenceDescriptor } = useConferenceDescriptor(props.event?.id);

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
  }

  //* Base style slot actions *//
  .talkActions {
    display: flex;
    flex-direction: row;

    &-watchLater, &-favorite { height: 100%;}

    &-actions {
      display: flex;
      align-items: end;
    }
  }
</style>
