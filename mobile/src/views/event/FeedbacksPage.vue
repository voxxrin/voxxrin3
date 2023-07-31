
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" />
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start" >{{ LL.Feedbacks() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-header class="stickyHeader">
        <day-selector
            :selected-day-id="currentlySelectedDayId"
            :days="event?.days || []"
            @day-selected="(day) => changeDayTo(day)">
        </day-selector>
      </ion-header>

      <ion-accordion-group :multiple="true" v-if="event && currentlySelectedDayId" :value="expandedTimeslotIds">
        <timeslots-iterator :conf-descriptor="event" :day-id="currentlySelectedDayId"
            :daily-schedule="currentSchedule"
            @timeslots-list-updated="timeslots => expandedTimeslotIds = timeslots.map(t => t.id.value)">
          <template #iterator="{ timeslot }">
            <time-slot-accordion v-if="timeslot.type==='talks' && timeslot.feedback.status !== 'provided-on-overlapping-timeslot'"
                :timeslot-feedback="timeslot.feedback"
                :timeslot="timeslot" :event="event"
                @add-timeslot-feedback-clicked="(ts) => navigateToTimeslotFeedbackCreation(ts)"
                @click="() => toggleExpandedTimeslot(timeslot)">
              <template #accordion-content="{ timeslot, feedback }">
                <ion-item v-if="feedback.status === 'missing'" class="listTalks-item">
                  <div class="infoMessage _small">
                    <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-no-feedback.svg"></ion-icon>
                    <span class="infoMessage-title">{{LL.No_feedback_yet()}}</span>
                    <!-- TODO Connect button add feed-back -->
                    <ion-button size="default" fill="outline"  expand="block">Add feedback slot</ion-button>
                  </div>
                </ion-item>
                <ion-item v-else-if="feedback.status === 'provided'" class="listTalks-item">
                  <schedule-talk :talk="findTimeslotTalkMatchingFeedback(timeslot, feedback.userFeedback)!" @talkClicked="toBeImplemented('To be implemented: opening feedback page in EDIT mode')" :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :event="event">
                    <template #upper-right="{ talk, talkNotesHook }">
                      <talk-format :format="talk.format" class="talkFormatContainer" />
                    </template>
                    <template #footer-actions="{ talk, talkNotesHook }">
                      <linear-rating v-if="event.features.ratings.scale.enabled" :config="event.features.ratings.scale"
                                     :user-feedback="feedback.userFeedback" :readonly="true" />
                    </template>
                  </schedule-talk>
                </ion-item>
                <ion-item v-else>
                  <div class="infoMessage _small">
                    <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-no-feedback.svg"></ion-icon>
                    <span class="infoMessage-title ion-color-secondary">Skipped</span>
                  </div>
                </ion-item>
              </template>
            </time-slot-accordion>
          </template>
        </timeslots-iterator>
      </ion-accordion-group>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue, toBeImplemented} from "@/views/vue-utils";
  import {useRoute} from "vue-router";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {computed, ref, watch} from "vue";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import DaySelector from "@/components/schedule/DaySelector.vue";
  import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
  import {findBestAutoselectableConferenceDay} from "@/models/VoxxrinConferenceDescriptor";
  import TimeSlotAccordion from "@/components/schedule/TimeSlotAccordion.vue";
  import {IonAccordionGroup} from "@ionic/vue";
  import {VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";
  import TimeslotsIterator from "@/components/timeslots/TimeslotsIterator.vue";
  import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
  import {useTabbedPageNav} from "@/state/useTabbedPageNav";
  import {useSchedule} from "@/state/useSchedule";
  import {findTimeslotTalkMatchingFeedback} from "@/models/VoxxrinFeedback";
  import TalkFormat from "@/components/timeslots/TalkFormat.vue";
  import LinearRating from "@/components/ratings/LinearRating.vue";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);

  const currentlySelectedDayId = ref<DayId|undefined>(undefined)
  const changeDayTo = (day: VoxxrinDay) => {
      currentlySelectedDayId.value = day.id;
  }

  const { schedule: currentSchedule } = useSchedule(event, currentlySelectedDayId)

  watch([event, currentlySelectedDayId], ([confDescriptor, selectedDayId]) => {
      console.debug(`current conf descriptor changed`, confDescriptor, selectedDayId)
      if (confDescriptor && !selectedDayId) {
          currentlySelectedDayId.value = findBestAutoselectableConferenceDay(confDescriptor).id;
      }
  }, {immediate: true})

  const expandedTimeslotIds = ref<string[]>([])
  function toggleExpandedTimeslot(timeslot: VoxxrinScheduleTimeSlot) {
      const expandedTimeslotIdsIndex = expandedTimeslotIds.value.indexOf(timeslot.id.value)
      if(expandedTimeslotIdsIndex === -1) {
          expandedTimeslotIds.value.push(timeslot.id.value);
      } else {
          expandedTimeslotIds.value.splice(expandedTimeslotIdsIndex, 1);
      }
  }

  const { triggerTabbedPageNavigate } = useTabbedPageNav();

  async function navigateToTimeslotFeedbackCreation(timeslot: VoxxrinScheduleTimeSlot) {
      triggerTabbedPageNavigate(`/events/${eventId.value.value}/new-feedback-for-timeslot/${timeslot.id.value}`, "forward", "push");
  }
</script>

<style scoped lang="scss">
  .listTalks-item {
    --padding-start: 0;
    --inner-padding-end: 0;
  }

  .infoMessage-iconIllu {
    position: absolute;
    opacity: 0.2;
    left: 0;
    top: 0;
  }

  .talkCard {
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .talkFormatContainer {
    display: flex;
    width: 100%;
  }
</style>
