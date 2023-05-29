
<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptorRef && dayIdRef">
      <ion-header>
        <ion-toolbar>
          <ion-title slot="start" >{{LL.Add_Feedback()}}</ion-title>
        </ion-toolbar>
        <h2>
          <ion-icon :icon="calendar" />
          {{labelledTimeslotRef?.label.date.full}}

          <ion-icon :icon="timeOutline" />
          {{labelledTimeslotRef?.label.full}}
        </h2>
        <h3>
          <span>1</span>
          {{LL.Pick_the_talk_you_attended()}}
        </h3>
      </ion-header>

      <div>
        <h4>
          {{LL.Currently_selected_timeslot()}}
          <div class="slotOverlay" v-if="labelledTimeslotRef?.overlappingTimeSlots.length > 0">
            <ion-icon aria-hidden="true" src="assets/icons/solid/slot-overlay.svg"></ion-icon>
            <span>
                <small>{{LL.Overlaps_x_slot_label()}}</small>
                <strong>{{LL.Overlaps_x_slot_value({nrOfOverlappingSlots: labelledTimeslotRef?.overlappingTimeSlots.length})}}</strong>
              </span>
          </div>
        </h4>
        <feedback-talk-selector :talks="labelledTimeslotRef?.talks || []" :day-id="dayIdRef" :event-descriptor="confDescriptorRef">
        </feedback-talk-selector>
      </div>
      <div>
        <h4>{{LL.Overlapping_timeslots({ nrOfOverlappingSlots: labelledTimeslotRef?.overlappingTimeSlots.length })}}</h4>
        <ion-accordion-group>
          <ion-accordion v-for="(overlappingTimeslot, index) in overlappingTimeslots" :key="overlappingTimeslot.id.value">
            <ion-item slot="header" color="light">
              <ion-label>
                <ion-icon :icon="timeOutline" />
                {{overlappingTimeslot.label.full}}
              </ion-label>
            </ion-item>
            <div slot="content">
              <feedback-talk-selector :talks="overlappingTimeslot.talks" :day-id="dayIdRef" :event-descriptor="confDescriptorRef">
              </feedback-talk-selector>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
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
