
<template>
  <ion-page v-if="confDescriptorRef && labelledTimeslotWithOverlappingsRef">
    <base-feedback-step :step="1" :step-label="LL.Pick_the_talk_you_attended()" :conf-descriptor="confDescriptorRef"
              :labelled-timeslot="labelledTimeslotWithOverlappingsRef.labelledTimeslot">
      <slot>
        <div>
          <ion-header class="pickTalkDivider">
            <div class="pickTalkDivider-start">
              <span class="pickTalkDivider-title">{{LL.Currently_selected_timeslot()}}</span>
              <small v-if="labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots.length">{{LL.Either_select_one_of_the_talk_you_attended()}}</small>
              <small v-if="!labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots.length">{{LL.Select_one_of_the_talk_you_attended()}}</small>
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
                :ref="(feedbackSelector) => updateFeedbackSelectorRefTo(labelledTimeslotWithOverlappingsRef?.labelledTimeslot?.id, feedbackSelector)"
                :conf-descriptor="confDescriptorRef"
                :talks="labelledTimeslotWithOverlappingsRef.labelledTimeslot.talks || []"
                :all-user-favorited-talk-ids="favoritedTalkIdsRef"
                :selected-talk-id="selectedTalk?.id"
                @talk-selected="selectTalk($event)"
                @talk-deselected="deselectTalk()"
            >
            </feedback-talk-selector>
          </div>
          <div v-if="labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots.length">
            <ion-header class="pickTalkDivider">
              <div class="pickTalkDivider-start">
                <span class="pickTalkDivider-title">{{LL.Overlapping_timeslots({ nrOfOverlappingSlots: labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots.length })}}</span>
                <small>{{LL.Or_select_a_talk_in_these_overlapping_slots()}}</small>
              </div>
            </ion-header>

            <ion-accordion-group :multiple="true" :value="overlappingTimeslotsAutoExpandIdsRef">
              <ion-accordion v-for="(overlappingTimeslot) in labelledTimeslotWithOverlappingsRef.overlappingLabelledTimeslots" :key="overlappingTimeslot.id.value"
                             class="slot-accordion" :value="overlappingTimeslot.id.value">
                <ion-item slot="header" color="light">
                  <ion-label>
                    <ion-icon aria-hidden="true" src="assets/icons/solid/slot-overlay.svg" />
                    {{overlappingTimeslot.label.full}}
                  </ion-label>
                </ion-item>
                <div slot="content">
                  <feedback-talk-selector
                      :ref="(feedbackSelector) => updateFeedbackSelectorRefTo(overlappingTimeslot.id, feedbackSelector)"
                      :conf-descriptor="confDescriptorRef"
                      :talks="overlappingTimeslot.talks"
                      :all-user-favorited-talk-ids="favoritedTalkIdsRef"
                      :selected-talk-id="selectedTalk?.id"
                      @talk-selected="selectTalk($event)"
                      @talk-deselected="deselectTalk()">
                  </feedback-talk-selector>
                </div>
              </ion-accordion>
            </ion-accordion-group>
          </div>
        </div>
      </slot>
    </base-feedback-step>
    <feedback-footer :conf-descriptor="confDescriptorRef">
      <template #details>
        <ion-button v-if="confDescriptorRef?.features.remindMeOnceVideosAreAvailableEnabled"
                    @click.stop="watchLaterAllFavoritedTalks()"
                    :aria-label="LL.Watch_later_all_favorited_talks()"
                    size="small" fill="outline" shape="round" expand="block">
          <ion-icon slot="start" src="assets/icons/solid/video.svg" aria-hidden="true"></ion-icon>
          {{LL.Watch_later_all_favorited_talks()}}
        </ion-button>
      </template>
      <template #default>
        <ion-button class="cancel" size="small" fill="solid" color="medium" shape="round" expand="block" @click="backToSchedulePage"
                    :aria-label="LL.Cancel_Back_To_Schedule()">
          {{ LL.Cancel() }}
        </ion-button>
        <ion-button size="small" fill="outline" shape="round" expand="block" v-if="selectedTalk === undefined" @click="submitSkippedFeedback()"
                    :aria-label="LL.I_didnt_attend_any_talk()">
            <span class="contentDidntAttendTalk">
              {{LL.I_didnt_attend_any_talk()}}
                <small>({{ LL.During_this_time_slot() }})</small>
            </span>
        </ion-button>
        <ion-button class="add-feedback-btn" size="small" fill="solid" shape="round" expand="block" v-if="selectedTalk !== undefined" @click="rateSelectedTalk()"
                    :aria-label="LL.Add_Feedback()">
              {{LL.Add_Feedback()}}
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
import {ComponentPublicInstance, computed, Ref, toValue, watch} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
    ScheduleTimeSlotId
} from "@/models/VoxxrinSchedule";
import {IonAccordion, IonAccordionGroup, useIonRouter} from "@ionic/vue";
import FeedbackTalkSelector from "@/components/feedbacks/FeedbackTalkSelector.vue";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import BaseFeedbackStep from "@/components/feedbacks/BaseFeedbackStep.vue";
import {
    findLabelledTimeslotWithOverlappingsForTimeslotId, LabelledTimeslot,
    LabelledTimeslotWithOverlappings
} from "@/state/findTimeslot";
import FeedbackFooter from "@/components/feedbacks/FeedbackFooter.vue";
import SlotOverlaps from "@/components/schedule/SlotOverlaps.vue";
import {goBackOrNavigateTo} from "@/router";
import {
    useUserEventTalkNotes,
} from "@/state/useUserTalkNotes";
import {useUserFeedbacks} from "@/state/useUserFeedbacks";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("NewFeedbackPage");

const { LL } = typesafeI18n()

const ionRouter = useIonRouter();
const route = useRoute();
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const timeslotIdRef = computed(() => new ScheduleTimeSlotId(getRouteParamsValue(route, 'timeslotId')));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const perTimeslotIdFeedbackTalkSelectorsRef = ref(new Map<string, InstanceType<typeof FeedbackTalkSelector>>())

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

function rateSelectedTalk() {
    if(isRefUndefined(confDescriptorRef) || isRefUndefined(selectedTalk)) {
        LOGGER.warn(() => `rateSelectedTalk() triggered with empty event or selected talk !`)
        return;
    }

    if(isRefDefined(confDescriptorRef) && isRefDefined(selectedTalk)) {
        ionRouter.navigate(`/events/${confDescriptorRef.value.id.value}/rate-talk/${selectedTalk.value.id.value}`, 'forward', 'replace')
    }
}

const everyCandidateTalksRef = computed(() => {
    const labelledTimeslotWithOverlappings = toValue(labelledTimeslotWithOverlappingsRef);

    const overlappingTimeslots: LabelledTimeslot[] = (labelledTimeslotWithOverlappings?.overlappingLabelledTimeslots || []);
    const overlappingTalks: VoxxrinTalk[] = overlappingTimeslots.flatMap(ts => ts.talks);
    const everyCandidateTalks: VoxxrinTalk[] = (labelledTimeslotWithOverlappings?.labelledTimeslot.talks || []).concat(overlappingTalks)
    return everyCandidateTalks;
})

const talkIdsRef = computed(() => {
    const everyCandidateTalks = toValue(everyCandidateTalksRef);
    return everyCandidateTalks.map(talk => talk.id);
})
const {userEventTalkNotesRef } = useUserEventTalkNotes(eventIdRef, talkIdsRef);

const favoritedTalkIdsRef = computed(() => {
    const userEventTalkNotes = toValue(userEventTalkNotesRef)
    return Array.from(userEventTalkNotes.values())
        .filter(talkNotes => talkNotes.isFavorite)
        .map(talkNotes => new TalkId(talkNotes.talkId))
})

const overlappingTimeslotsAutoExpandIdsRef = ref<string[]>([]);
watch([favoritedTalkIdsRef, labelledTimeslotWithOverlappingsRef], ([favoritedTalkIds, labelledTimeslotWithOverlappings]) => {
    if(!favoritedTalkIds || !labelledTimeslotWithOverlappings) {
        return;
    }

    overlappingTimeslotsAutoExpandIdsRef.value = labelledTimeslotWithOverlappings.overlappingLabelledTimeslots
        .filter(overlappingTimeslot => overlappingTimeslot.talks.filter(talk => talk.id.isIncludedIntoArray(favoritedTalkIds)).length > 0)
        .map(overlappingTimeslot => overlappingTimeslot.id.value);
})

async function watchLaterAllFavoritedTalks() {
    perTimeslotIdFeedbackTalkSelectorsRef.value.forEach((overlappingTimeslotsFeedbackTalkSelector, timeslotId) => {
        overlappingTimeslotsFeedbackTalkSelector.watchLaterAllFavoritedTalks()
    })
}

function backToSchedulePage() {
    goBackOrNavigateTo(ionRouter, `/events/${eventIdRef.value.value}`)
}

const dayIdRef = computed(() => labelledTimeslotWithOverlappingsRef.value?.dayId)
const { updateTimeslotFeedback } = useUserFeedbacks(eventIdRef, dayIdRef)
async function submitSkippedFeedback() {
    await updateTimeslotFeedback(timeslotIdRef.value, {
        status: 'skipped',
        timeslotId: labelledTimeslotWithOverlappingsRef.value!.labelledTimeslot.id.value,
        alsoConcernsOverlappingTimeslotIds: labelledTimeslotWithOverlappingsRef.value!.overlappingLabelledTimeslots.map(ts => ts.id.value)
    })
    goBackOrNavigateTo(ionRouter, `/events/${eventIdRef.value.value}`)
}

function updateFeedbackSelectorRefTo(timeslotId: ScheduleTimeSlotId|undefined, feedbackSelector: any) {
    if(timeslotId && feedbackSelector) {
        perTimeslotIdFeedbackTalkSelectorsRef.value.set(timeslotId.value, feedbackSelector)
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
    background: var(--voxxrin-event-theme-colors-secondary-hex);
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
      background-color: var(--voxxrin-event-theme-colors-secondary-hex);
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

  .add-feedback-btn {
    --background: var(--voxxrin-event-theme-colors-secondary-hex)
  }
</style>
