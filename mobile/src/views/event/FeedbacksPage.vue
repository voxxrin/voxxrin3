
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

      <div v-if="!areFeedbacksEnabled(confDescriptor)">
        {{LL.Feedbacks_are_not_enabled_on_this_event()}}
      </div>
      <div v-else>
        <ion-accordion-group :multiple="true" v-if="confDescriptor && selectedDayId" :value="expandedTimeslotIds">
          <timeslots-iterator :conf-descriptor="confDescriptor" :day-id="selectedDayId"
                              :daily-schedule="currentSchedule"
                              @timeslots-list-updated="timeslots => expandedTimeslotIds = timeslots.map(t => t.id.value)">
            <template #iterator="{ timeslot, progress }">
              <time-slot-accordion v-if="timeslot.type==='talks' && timeslot.feedback.status !== 'provided-on-overlapping-timeslot'"
                                   :conf-descriptor="confDescriptor"
                                   :timeslot-feedback="timeslot.feedback"
                                   :timeslot="timeslot" :event="confDescriptor"
                                   :progress="progress"
                                   @add-timeslot-feedback-clicked="(ts) => navigateToTimeslotFeedbackCreation(ts)"
                                   @click="() => toggleExpandedTimeslot(timeslot)">
                <template #accordion-content="{ timeslot, feedback, progressStatus }">
                  <ion-item v-if="feedback.status === 'missing'" class="listTalks-item">
                    <no-results illu-path="images/svg/illu-no-feedback.svg" class="_small"
                          @button-clicked="navigateToTimeslotFeedbackCreation(timeslot)"
                          :button-label="progressStatus === 'past' ? LL.Add_Feedback() : undefined" position="absolute">
                      <template #title>{{LL.No_feedback_yet()}}</template>
                    </no-results>
                  </ion-item>
                  <ion-item v-else-if="feedback.status === 'provided'" class="listTalks-item">
                    <talk-card :talk="findTimeslotTalkMatchingFeedback(timeslot, feedback.userFeedback)!" scope="rating"
                                   :room-id="findTimeslotTalkMatchingFeedback(timeslot, feedback.userFeedback)!.room?.id"
                                   :talk-notes="userEventTalkNotesRef.get(findTimeslotTalkMatchingFeedback(timeslot, feedback.userFeedback)!.id.value)"
                                   :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite"
                                   :conf-descriptor="confDescriptor"
                                   @talkClicked="toBeImplemented('To be implemented: opening feedback page in EDIT mode')">
                      <template #upper-right="{ talk }">
                        <talk-format :conf-descriptor="confDescriptor" :format="talk.format" class="talkFormatContainer" />
                      </template>
                      <template #footer-actions="{ talk }">
                        <linear-rating v-if="confDescriptor.features.ratings.scale.enabled" :config="confDescriptor.features.ratings.scale"
                                       :user-feedback="feedback.userFeedback" :readonly="true" :is-small="true" />
                      </template>
                    </talk-card>
                  </ion-item>
                  <ion-item v-else>
                    <no-results illu-path="icons/solid/comment-feedback-skipped.svg" class="_small" position="absolute">
                      <template #title><em class="ion-color-secondary">{{ LL.Skipped() }}</em></template>
                    </no-results>
                  </ion-item>
                </template>
              </time-slot-accordion>
            </template>
          </timeslots-iterator>
        </ion-accordion-group>
      </div>
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {toBeImplemented} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {managedRef as ref} from "@/views/vue-utils";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import DaySelector from "@/components/schedule/DaySelector.vue";
  import TimeSlotAccordion from "@/components/timeslots/TimeSlotAccordion.vue";
  import {IonAccordionGroup} from "@ionic/vue";
  import {extractTalksFromSchedule, VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";
  import TimeslotsIterator from "@/components/timeslots/TimeslotsIterator.vue";
  import TalkCard from "@/components/talk-card/TalkCard.vue";
  import {useTabbedPageNav} from "@/state/useTabbedPageNav";
  import {useSchedule} from "@/state/useSchedule";
  import {findTimeslotTalkMatchingFeedback} from "@/models/VoxxrinFeedback";
  import TalkFormat from "@/components/timeslots/TalkFormat.vue";
  import LinearRating from "@/components/ratings/LinearRating.vue";
  import {useSharedEventSelectedDay} from "@/state/useEventSelectedDay";
  import {areFeedbacksEnabled} from "@/models/VoxxrinConferenceDescriptor";
  import {useUserEventTalkNotes} from "@/state/useUserTalkNotes";
  import {computed, toValue} from "vue";
  import NoResults from "@/components/ui/NoResults.vue";
  import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";
  import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

  const { LL } = typesafeI18n()

  const spacedEventIdRef = useCurrentSpaceEventIdRef();
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);

  const {selectedDayId} = useSharedEventSelectedDay(spacedEventIdRef);

  const { schedule: currentSchedule } = useSchedule(confDescriptor, selectedDayId)

  const talkIdsRef = computed(() => {
      const schedule = toValue(currentSchedule);
      return schedule ? extractTalksFromSchedule(schedule).map(talk => talk.id) : [];
  })

  const {userEventTalkNotesRef} = useUserEventTalkNotes(spacedEventIdRef, talkIdsRef)

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
      triggerTabbedPageNavigate(`${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/new-feedback-for-timeslot/${timeslot.id.value}`, "forward", "push");
  }
</script>

<style scoped lang="scss">
  .listTalks-item {
    --padding-start: 0;
    --inner-padding-end: 0;
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
