
<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header :conf-descriptor="confDescriptor" />
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start" >{{ LL.Feedbacks() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-header class="stickyHeader">
        <day-selector :conf-descriptor="confDescriptor">
        </day-selector>
      </ion-header>

      <ion-accordion-group :multiple="true" v-if="confDescriptor && selectedDayId" :value="expandedTimeslotIds">
        <timeslots-iterator :conf-descriptor="confDescriptor" :day-id="selectedDayId"
                            :daily-schedule="currentSchedule"
                            @timeslots-list-updated="timeslots => expandedTimeslotIds = timeslots.map(t => t.id.value)">
          <template #iterator="{ timeslot }">
            <time-slot-accordion v-if="timeslot.type==='talks' && timeslot.feedback.status !== 'provided-on-overlapping-timeslot'"
                :conf-descriptor="confDescriptor"
                :timeslot-feedback="timeslot.feedback"
                :timeslot="timeslot" :event="confDescriptor"
                @add-timeslot-feedback-clicked="(ts) => navigateToTimeslotFeedbackCreation(ts)"
                @click="() => toggleExpandedTimeslot(timeslot)">
              <template #accordion-content="{ timeslot, feedback }">
                <ion-item v-if="feedback.status === 'missing'" class="listTalks-item">
                  <div class="infoMessage _small">
                    <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-no-feedback.svg"></ion-icon>
                    <span class="infoMessage-title">{{LL.No_feedback_yet()}}</span>
                    <ion-button @click="navigateToTimeslotFeedbackCreation(timeslot)" size="default" fill="outline"  expand="block">{{LL.Add_Feedback()}}</ion-button>
                  </div>
                </ion-item>
                <ion-item v-else-if="feedback.status === 'provided'" class="listTalks-item">
                  <schedule-talk :talk="findTimeslotTalkMatchingFeedback(timeslot, feedback.userFeedback)!" @talkClicked="toBeImplemented('To be implemented: opening feedback page in EDIT mode')" :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor">
                    <template #upper-right="{ talk, talkNotesHook }">
                      <talk-format :format="talk.format" class="talkFormatContainer" />
                    </template>
                    <template #footer-actions="{ talk, talkNotesHook }">
                      <linear-rating v-if="confDescriptor.features.ratings.scale.enabled" :config="confDescriptor.features.ratings.scale"
                                     :user-feedback="feedback.userFeedback" :readonly="true" :is-small="true" />
                    </template>
                  </schedule-talk>
                </ion-item>
                <ion-item v-else>
                  <div class="infoMessage _small">
                    <ion-icon class="infoMessage-iconIllu _skipped" src="assets/icons/solid/comment-feedback-skipped.svg"></ion-icon>
                    <span class="infoMessage-title ion-color-secondary"><em>{{ LL.Skipped() }}</em></span>
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
  import {ref} from "vue";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import DaySelector from "@/components/schedule/DaySelector.vue";
  import TimeSlotAccordion from "@/components/timeslots/TimeSlotAccordion.vue";
  import {IonAccordionGroup} from "@ionic/vue";
  import {VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";
  import TimeslotsIterator from "@/components/timeslots/TimeslotsIterator.vue";
  import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
  import {useTabbedPageNav} from "@/state/useTabbedPageNav";
  import {useSchedule} from "@/state/useSchedule";
  import {findTimeslotTalkMatchingFeedback} from "@/models/VoxxrinFeedback";
  import TalkFormat from "@/components/timeslots/TalkFormat.vue";
  import LinearRating from "@/components/ratings/LinearRating.vue";
  import {useSharedEventSelectedDay} from "@/state/useEventSelectedDay";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

  const {selectedDayId} = useSharedEventSelectedDay(eventId);

  const { schedule: currentSchedule } = useSchedule(confDescriptor, selectedDayId)

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

    &._skipped {
      font-size: 64px;
      opacity: 0.1;
      top: -4px;
    }
  }

  .talkCard {
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .talkFormatContainer {
    display: flex;
    justify-content: end;
    align-items: center;
    width: 100%;
  }
</style>
