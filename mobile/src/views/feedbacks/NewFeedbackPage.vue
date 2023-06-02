
<template>
  <ion-page v-if="confDescriptorRef && labelledTimeslotAndScheduleRef">
    <base-feedback-step :step="1" :step-label="LL.Pick_the_talk_you_attended()"
          :conf-descriptor="confDescriptorRef" :labelled-timeslot="labelledTimeslotAndScheduleRef.labelledTimeslot">
      <slot>
        <div>
          <ion-header class="pickTalkDivider">
            <div class="pickTalkDivider-start">
              <span class="pickTalkDivider-title">{{LL.Currently_selected_timeslot()}}</span>
              <small><strong>1</strong> {{LL.Pick_the_talk_you_attended()}}</small>
            </div>

            <div class="pickTalkDivider-end">
              <div class="slotOverlay" v-if="labelledTimeslotAndScheduleRef.labelledTimeslot.overlappingTimeSlots.length > 0">
                <ion-icon aria-hidden="true" src="assets/icons/solid/slot-overlay.svg"></ion-icon>
                <span class="slotOverlay-txt">
                <small>{{LL.Overlaps_x_slot_label()}}</small>
                <strong>{{LL.Overlaps_x_slot_value({nrOfOverlappingSlots: labelledTimeslotAndScheduleRef.labelledTimeslot.overlappingTimeSlots.length})}}</strong>
              </span>
              </div>
            </div>

            <ion-label class="pickTalkDivider-timeSlotResume" v-if="labelledTimeslotAndScheduleRef.labelledTimeslot.label">
              <ion-icon aria-hidden="true" src="/assets/icons/solid/clock.svg"></ion-icon>
              <span class="slot-schedule-start">{{labelledTimeslotAndScheduleRef.labelledTimeslot.label.start}}</span>
              <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              <span class="slot-schedule-end">{{labelledTimeslotAndScheduleRef.labelledTimeslot.label.end}}</span>
            </ion-label>
          </ion-header>
          <div>
            <feedback-talk-selector
                :event-descriptor="confDescriptorRef"
                :talks="labelledTimeslotAndScheduleRef.labelledTimeslot.talks || []"
                @talk-selected="selectTalk($event)"
                @talk-deselected="deselectTalk()"
            >
            </feedback-talk-selector>
          </div>
          <div v-if="labelledTimeslotAndScheduleRef.labelledTimeslot.overlappingTimeSlots.length">
            <ion-header class="pickTalkDivider">
              <div class="pickTalkDivider-start">
                <span class="pickTalkDivider-title">{{LL.Overlapping_timeslots({ nrOfOverlappingSlots: labelledTimeslotAndScheduleRef.labelledTimeslot.overlappingTimeSlots.length })}}</span>
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
      </slot>
    </base-feedback-step>
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
import {getRouteParamsValue, isRefDefined, isRefUndefined} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, ref, Ref, unref} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    findTalksTimeslotById,
    getTimeslotLabel,
    ScheduleTimeSlotId
} from "@/models/VoxxrinSchedule";
import {IonAccordion, IonAccordionGroup, IonFooter, useIonRouter} from "@ionic/vue";
import FeedbackTalkSelector from "@/components/FeedbackTalkSelector.vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import BaseFeedbackStep from "@/components/BaseFeedbackStep.vue";
import {LabelledTimeslot, useFindLabelledTimeslot} from "@/state/useFindTimeslot";

const { LL } = typesafeI18n()

const router = useIonRouter();
const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const timeslotIdRef = computed(() => new ScheduleTimeSlotId(getRouteParamsValue(route, 'timeslotId')));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const {labelledTimeslotAndScheduleRef} = useFindLabelledTimeslot(confDescriptorRef.value!, timeslotIdRef.value);

const selectedTalk: Ref<VoxxrinTalk|undefined> = ref(undefined)
function selectTalk(talk: VoxxrinTalk) {
    selectedTalk.value = talk;
}
function deselectTalk() {
    selectedTalk.value = undefined;
}

const overlappingTimeslots = computed((): Array<LabelledTimeslot> => {
    const labelledTimeslotAndSchedule = unref(labelledTimeslotAndScheduleRef)

    if(!labelledTimeslotAndSchedule) {
        return [];
    }

    const overlappingTS = labelledTimeslotAndSchedule.labelledTimeslot.overlappingTimeSlots.map(timeslotId => {
        const timeslot = findTalksTimeslotById(labelledTimeslotAndSchedule.schedule, timeslotId);
        if(!timeslot) {
            return undefined;
        }

        const labelledTimeslot: LabelledTimeslot = { ...timeslot, label: getTimeslotLabel(timeslot) };
        return labelledTimeslot;
    }).filter(ts => !!ts) as Array<LabelledTimeslot>;
    return overlappingTS;
})

const {triggerTabbedPageNavigate} = useTabbedPageNav()

function rateSelectedTalk() {
    if(isRefUndefined(event) || isRefUndefined(selectedTalk)) {
        console.warn(`rateSelectedTalk() triggered with empty event or selected talk !`)
        return;
    }

    if(isRefDefined(event) && isRefDefined(selectedTalk)) {
        triggerTabbedPageNavigate(`/events/${event.value.id.value}/rate-talk/${selectedTalk.value.id.value}`, 'forward', 'replace');
    }
}

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

  .contentDidntAttendTalk {
    display: inline-flex;
    flex-direction: column;
    row-gap: 2px;
  }
</style>
