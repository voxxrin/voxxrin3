
<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptorRef && dayIdRef && labelledTimeslotRef" :style="{
          '--voxxrin-event-theme-colors-primary-hex': event.theming.colors.primaryHex,
          '--voxxrin-event-theme-colors-primary-rgb': event.theming.colors.primaryRGB,
          '--voxxrin-event-theme-colors-primary-contrast-hex': event.theming.colors.primaryContrastHex,
          '--voxxrin-event-theme-colors-primary-contrast-rgb': event.theming.colors.primaryContrastRGB,
          '--voxxrin-event-theme-colors-secondary-hex': event.theming.colors.secondaryHex,
          '--voxxrin-event-theme-colors-secondary-rgb': event.theming.colors.secondaryRGB,
          '--voxxrin-event-theme-colors-secondary-contrast-hex': event.theming.colors.secondaryContrastHex,
          '--voxxrin-event-theme-colors-secondary-contrast-rgb': event.theming.colors.secondaryContrastRGB,
          '--voxxrin-event-theme-colors-tertiary-hex': event.theming.colors.tertiaryHex,
          '--voxxrin-event-theme-colors-tertiary-rgb': event.theming.colors.tertiaryRGB,
          '--voxxrin-event-theme-colors-tertiary-contrast-hex': event.theming.colors.tertiaryContrastHex,
          '--voxxrin-event-theme-colors-tertiary-contrast-rgb': event.theming.colors.tertiaryContrastRGB,
    }">
      <ion-header class="stickyHeader">
        <ion-toolbar>
        <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="$router.back()">
          <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
        </ion-button>
        <ion-title class="stickyHeader-title" slot="start">{{LL.Add_Feedback()}}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-header class="subHeader">
        <div class="subHeader-schedule">
          <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" src="assets/icons/solid/calendar.svg"></ion-icon>
          <ion-label>{{labelledTimeslotRef.label.date.full}}</ion-label>
        </div>
        <div class="subHeader-timeSlot">
          <ion-icon aria-hidden="true" src="/assets/icons/solid/clock.svg"></ion-icon>
          {{labelledTimeslotRef.label.full}}
        </div>
      </ion-header>

      <ion-header class="stepHeader">
        <span class="stepHeader-nb">1</span>
        {{LL.Pick_the_talk_you_attended()}}
      </ion-header>

      <div>
        <ion-header class="pickTalkDivider">
          <div class="pickTalkDivider-start">
            <span class="pickTalkDivider-title">{{LL.Currently_selected_timeslot()}}</span>
            <small><strong>1</strong> {{LL.Pick_the_talk_you_attended()}}</small>
          </div>

          <div class="pickTalkDivider-end">
            <div class="slotOverlay" v-if="labelledTimeslotRef.overlappingTimeSlots.length > 0">
              <ion-icon aria-hidden="true" src="assets/icons/solid/slot-overlay.svg"></ion-icon>
              <span class="slotOverlay-txt">
                <small>{{LL.Overlaps_x_slot_label()}}</small>
                <strong>{{LL.Overlaps_x_slot_value({nrOfOverlappingSlots: labelledTimeslotRef.overlappingTimeSlots.length})}}</strong>
              </span>
            </div>
          </div>

          <ion-label class="pickTalkDivider-timeSlotResume" v-if="labelledTimeslotRef.label">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/clock.svg"></ion-icon>
            <span class="slot-schedule-start">{{labelledTimeslotRef.label.start}}</span>
            <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
            <span class="slot-schedule-end">{{labelledTimeslotRef.label.end}}</span>
          </ion-label>
        </ion-header>
        <div>
          <feedback-talk-selector
              :event-descriptor="confDescriptorRef"
              :talks="labelledTimeslotRef.talks || []"
              @talk-selected="selectTalk($event)"
              @talk-deselected="deselectTalk()"
          >
          </feedback-talk-selector>
        </div>
        <div v-if="labelledTimeslotRef.overlappingTimeSlots.length">
          <ion-header class="pickTalkDivider">
            <div class="pickTalkDivider-start">
              <span class="pickTalkDivider-title">{{LL.Overlapping_timeslots({ nrOfOverlappingSlots: labelledTimeslotRef.overlappingTimeSlots.length })}}</span>
            </div>
          </ion-header>

          <ion-accordion-group>
            <ion-accordion class="slot-accordion" v-for="(overlappingTimeslot) in overlappingTimeslots" :key="overlappingTimeslot.id.value">
              <ion-item slot="header" color="light">
                <ion-label>
                  <ion-icon aria-hidden="true" src="assets/icons/solid/slot-overlay.svg" />
                  {{overlappingTimeslot.label.full}}
                </ion-label>
              </ion-item>
              <div slot="content">
                <feedback-talk-selector
                    :event-descriptor="confDescriptorRef"
                    :talks="overlappingTimeslot.talks"
                    @talk-selected="selectTalk($event)"
                    @talk-deselected="deselectTalk()"
                >
                </feedback-talk-selector>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </div>
      </div>
    </ion-content>
    <ion-footer class="feedBackFooter">
      <ion-toolbar>
        <ion-button size="small" fill="outline" shape="round" expand="block" v-if="event?.features.remindMeOnceVideosAreAvailableEnabled">
            <ion-icon slot="start" src="assets/icons/solid/video.svg"  aria-hidden="true"></ion-icon>
              {{LL.Watch_later_all_favorited_talks()}}
        </ion-button>
        <div class="feedBackFooter-group">
          <ion-button size="small" fill="solid" color="medium" shape="round" expand="block">{{ LL.Cancel() }}</ion-button>
          <ion-button size="small" fill="outline" shape="round" expand="block" v-if="selectedTalk === undefined">
            <span class="contentDidntAttendTalk">
              {{LL.I_didnt_attend_any_talk()}}
                <small>({{ LL.During_this_time_slot() }})</small>
            </span>
          </ion-button>
          <ion-button size="small" fill="solid" shape="round" expand="block" v-if="selectedTalk !== undefined" @click="rateSelectedTalk()">
            <span class="contentDidntAttendTalk">
              {{LL.Add_Feedback()}}
            </span>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, ref, Ref, unref} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {calendar, timeOutline} from "ionicons/icons";
import {DayId} from "@/models/VoxxrinDay";
import {
    findTalksTimeslotById,
    getTimeslotLabel,
    ScheduleTimeSlotId, VoxxrinScheduleTalksTimeSlot
} from "@/models/VoxxrinSchedule";
import {useSchedule} from "@/state/useSchedule";
import {IonAccordion, IonAccordionGroup} from "@ionic/vue";
import FeedbackTalkSelector from "@/components/FeedbackTalkSelector.vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";

const { LL } = typesafeI18n()

const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const dayIdRef = computed(() => new DayId(getRouteParamsValue(route, 'dayId')));
const timeslotIdRef = computed(() => new ScheduleTimeSlotId(getRouteParamsValue(route, 'timeslotId')));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const { schedule: scheduleRef } = useSchedule(confDescriptorRef, dayIdRef)

const selectedTalk: Ref<VoxxrinTalk|undefined> = ref(undefined)
function selectTalk(talk: VoxxrinTalk) {
    selectedTalk.value = talk;
}
function deselectTalk() {
    selectedTalk.value = undefined;
}

type LabelledTimeslot = VoxxrinScheduleTalksTimeSlot & {label: ReturnType<typeof getTimeslotLabel>};

const labelledTimeslotRef = computed((): LabelledTimeslot|undefined => {
    const schedule = unref(scheduleRef),
        timeslotId = unref(timeslotIdRef);

    if(!schedule || !timeslotId) {
        return undefined;
    }

    const timeslot = findTalksTimeslotById(schedule, timeslotId);

    if(!timeslot) {
        return undefined;
    }

    const labelledTimeslot: LabelledTimeslot = {
        ...timeslot,
        label: getTimeslotLabel(timeslot)
    }
    return labelledTimeslot;
})

const overlappingTimeslots = computed((): Array<LabelledTimeslot> => {
    const timeslot = unref(labelledTimeslotRef),
        schedule = unref(scheduleRef);

    if(!timeslot || !schedule) {
        return [];
    }

    const overlappingTS = timeslot.overlappingTimeSlots.map(timeslotId => {
        const timeslot = findTalksTimeslotById(schedule, timeslotId);
        if(!timeslot) {
            return undefined;
        }

        const labelledTimeslot: LabelledTimeslot = { ...timeslot, label: getTimeslotLabel(timeslot) };
        return labelledTimeslot;
    }).filter(ts => !!ts) as Array<LabelledTimeslot>;
    return overlappingTS;
})

</script>

<style scoped lang="scss">
  .pickTalkDivider {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    row-gap: 4px;
    padding: 8px 16px;
    background: var(--app-primary);
    color: white;
    z-index: 1;

    &-start {
      display: flex;
      flex-direction: column;
      row-gap: 4px;
    }

    &-end {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &-title {
      font-size: 18px;
      font-weight: bold !important;
    }

    &-timeSlotResume {
      display: flex;
      flex-direction: row;
      align-items: center;
      column-gap: 2px;
      position: absolute;
      right: 0;
      bottom: -8px;
      border-radius: 0 0 0 8px;
      padding: 4px 12px;
      font-size: 12px;
      background-color: var(--app-primary);
    }
  }

  .feedBackFooter {

    ion-toolbar {
      --background: var(--app-white);
      --padding-top: 12px;
      --padding-bottom: 8px;
      --padding-start: 4px;
      --padding-end: 4px;
      --min-height: 44px;
      box-shadow: 0px 3px 20px rgba(0, 0, 0, 0.5);
    }

    &-group {
      display: flex;
      column-gap: 8px;
      margin-top: 8px;

      ion-button:first-child { width: 128px}
      ion-button:last-child { flex: 1;}
    }
  }

  .contentDidntAttendTalk {
    display: inline-flex;
    flex-direction: column;
    row-gap: 2px;
  }
</style>
