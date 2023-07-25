
<template>
  <ion-page v-if="confDescriptorRef && labelledTimeslotWithOverlappingsRef">
    <base-feedback-step :step="1" :step-label="LL.Pick_the_talk_you_attended()" :conf-descriptor="confDescriptorRef"
              :labelled-timeslot="labelledTimeslotWithOverlappingsRef.labelledTimeslot">
      <slot>
        <div>
          <ion-header class="pickTalkDivider">
            <div class="pickTalkDivider-start">
              <span class="pickTalkDivider-title">{{LL.Currently_selected_timeslot()}}</span>
              <small><strong>1</strong> {{LL.Pick_the_talk_you_attended()}}</small>
            </div>

            <div class="pickTalkDivider-end">
              <slot-overlaps :overlappingTimeslots="labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots"></slot-overlaps>
            </div>

            <ion-label class="pickTalkDivider-timeSlotResume" v-if="labelledTimeslotWithOverlappingsRef.labelledTimeslot.label">
              <ion-icon aria-hidden="true" src="/assets/icons/solid/clock.svg"></ion-icon>
              <span class="slot-schedule-start">{{labelledTimeslotWithOverlappingsRef.labelledTimeslot.label.start}}</span>
              <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              <span class="slot-schedule-end">{{labelledTimeslotWithOverlappingsRef.labelledTimeslot.label.end}}</span>
            </ion-label>
          </ion-header>
          <div>
            <feedback-talk-selector
                :event-descriptor="confDescriptorRef"
                :talks="labelledTimeslotWithOverlappingsRef.labelledTimeslot.talks || []"
                @talk-selected="selectTalk($event)"
                @talk-deselected="deselectTalk()"
            >
            </feedback-talk-selector>
          </div>
          <div v-if="labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots.length">
            <ion-header class="pickTalkDivider">
              <div class="pickTalkDivider-start">
                <span class="pickTalkDivider-title">{{LL.Overlapping_timeslots({ nrOfOverlappingSlots: labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots.length })}}</span>
              </div>
            </ion-header>

            <ion-accordion-group>
              <ion-accordion class="slot-accordion" v-for="(overlappingTimeslot) in labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots" :key="overlappingTimeslot.id.value">
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
    <feedback-footer>
      <template #details>
        <ion-button size="small" fill="outline" shape="round" expand="block" v-if="event?.features.remindMeOnceVideosAreAvailableEnabled">
          <ion-icon slot="start" src="assets/icons/solid/video.svg"  aria-hidden="true"></ion-icon>
          {{LL.Watch_later_all_favorited_talks()}}
        </ion-button>
      </template>
      <template #default>
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
      </template>
    </feedback-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue, isRefDefined, isRefUndefined} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, ref, Ref, unref, watch} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    ScheduleTimeSlotId
} from "@/models/VoxxrinSchedule";
import {IonAccordion, IonAccordionGroup, IonFooter, useIonRouter} from "@ionic/vue";
import FeedbackTalkSelector from "@/components/FeedbackTalkSelector.vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import BaseFeedbackStep from "@/components/BaseFeedbackStep.vue";
import {
    findLabelledTimeslotWithOverlappingsForTimeslotId,
    LabelledTimeslot,
    LabelledTimeslotWithOverlappings
} from "@/state/findTimeslot";
import FeedbackFooter from "@/components/FeedbackFooter.vue";
import SlotOverlaps from "@/components/SlotOverlaps.vue";

const { LL } = typesafeI18n()

const router = useIonRouter();
const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const timeslotIdRef = computed(() => new ScheduleTimeSlotId(getRouteParamsValue(route, 'timeslotId')));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const labelledTimeslotWithOverlappingsRef = ref<undefined | LabelledTimeslotWithOverlappings>(undefined)

watch([confDescriptorRef, timeslotIdRef], async ([confDescriptor, timeslotId]) => {
    if(!confDescriptor || !timeslotId) {
        labelledTimeslotWithOverlappingsRef.value = undefined;
        return;
    }

    const labelledTimeslotWithOverlappings = await findLabelledTimeslotWithOverlappingsForTimeslotId(confDescriptor, timeslotId);
    labelledTimeslotWithOverlappingsRef.value = labelledTimeslotWithOverlappings;
}, { immediate: true })

const selectedTalk: Ref<VoxxrinTalk|undefined> = ref(undefined)
function selectTalk(talk: VoxxrinTalk) {
    selectedTalk.value = talk;
}
function deselectTalk() {
    selectedTalk.value = undefined;
}

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

    @media (prefers-color-scheme: dark) {
      background: var(--app-light-contrast);
    }

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
      z-index: 1;

      @media (prefers-color-scheme: dark) {
        background: var(--app-light-contrast);
      }
    }
  }

  .contentDidntAttendTalk {
    display: inline-flex;
    flex-direction: column;
    row-gap: 2px;
  }
</style>