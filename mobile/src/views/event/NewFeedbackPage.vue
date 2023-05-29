
<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptorRef && dayIdRef && labelledTimeslotRef">
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
            <ion-label v-if="labelledTimeslotRef.label">
              <span class="slot-schedule-start">{{labelledTimeslotRef.label.start}}</span>
              <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              <span class="slot-schedule-end">{{labelledTimeslotRef.label.end}}</span>
            </ion-label>
          </div>
        </ion-header>
        <div>
          <feedback-talk-selector :talks="labelledTimeslotRef.talks || []" :event-descriptor="confDescriptorRef">
          </feedback-talk-selector>
        </div>
        <div v-if="labelledTimeslotRef.overlappingTimeSlots.length">
          <h4>{{LL.Overlapping_timeslots({ nrOfOverlappingSlots: labelledTimeslotRef.overlappingTimeSlots.length })}}</h4>
          <ion-accordion-group>
            <ion-accordion v-for="(overlappingTimeslot) in overlappingTimeslots" :key="overlappingTimeslot.id.value">
              <ion-item slot="header" color="light">
                <ion-label>
                  <ion-icon :icon="timeOutline" />
                  {{overlappingTimeslot.label.full}}
                </ion-label>
              </ion-item>
              <div slot="content">
                <feedback-talk-selector :talks="overlappingTimeslot.talks" :event-descriptor="confDescriptorRef">
                </feedback-talk-selector>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, unref} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {calendar, timeOutline} from "ionicons/icons";
import {DayId} from "@/models/VoxxrinDay";
import {
    findTalksTimeslotById,
    getTimeslotLabel,
    ScheduleTimeSlotId, VoxxrinScheduleTalksTimeSlot
} from "@/models/VoxxrinSchedule";
import {useSchedule} from "@/state/useSchedule";
import TalkFormatGroupsBreakdown from "@/components/TalkFormatGroupsBreakdown.vue";
import {IonAccordion, IonAccordionGroup} from "@ionic/vue";
import FeedbackTalkSelector from "@/components/FeedbackTalkSelector.vue";

const { LL } = typesafeI18n()

const route = useRoute();

const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const dayIdRef = computed(() => new DayId(getRouteParamsValue(route, 'dayId')));
const timeslotIdRef = computed(() => new ScheduleTimeSlotId(getRouteParamsValue(route, 'timeslotId')));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const { schedule: scheduleRef } = useSchedule(confDescriptorRef, dayIdRef)

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
  }
</style>
