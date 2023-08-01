<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="confDescriptor" :conf-descriptor="confDescriptor" />
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start" >{{ LL.Favorites() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-header class="stickyHeader">
        <day-selector
            :selected-day-id="currentlySelectedDayId"
            :days="confDescriptor?.days || []"
            @day-selected="(day) => changeDayTo(day)">
        </day-selector>
      </ion-header>

      <ion-accordion-group :multiple="true" v-if="confDescriptor && currentlySelectedDayId" :value="expandedTimeslotIds">
        <timeslots-iterator :conf-descriptor="confDescriptor" :day-id="currentlySelectedDayId"
                            :daily-schedule="currentSchedule"
                            @timeslots-list-updated="timeslots => expandedTimeslotIds = timeslots.map(t => t.id.value)">
          <template #iterator="{ timeslot }">
            <time-slot-section :timeslot="timeslot" :conf-descriptor="confDescriptor">
              <template #section-content="{ timeslot }">
                <schedule-break v-if="timeslot.type==='break'" :conf-descriptor="confDescriptor" :talk-break="timeslot.break"></schedule-break>
                <div v-if="timeslot.type === 'talks'">
                  <div class="infoMessage ion-text-center" v-if="timeslot.talks.filter(t => t.id.isIncludedIntoArray(allUserFavoritedTalkIds)).length === 0">
                    <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-no-favorites.svg"></ion-icon>
                    <span class="infoMessage-title">{{ LL.No_favorites_defined_yet() }}</span>
                  </div>
                  <talk-format-groups-breakdown :conf-descriptor="confDescriptor" v-if="timeslot.type==='talks'" :talks="timeslot.talks.filter(t => t.id.isIncludedIntoArray(allUserFavoritedTalkIds))">
                    <template #talk="{ talk }">
                      <schedule-talk :talk="talk" @talkClicked="openTalkDetails($event)" :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor">
                        <template #upper-middle="{ talk }">
                          <div class="room" v-if="confDescriptor?.features.roomsDisplayed">
                            {{talk.room.title}}
                          </div>
                        </template>
                        <template #footer-actions="{ talk, talkNotesHook }">
                          <talk-watch-later-button v-if="confDescriptor" :conf-descriptor="confDescriptor" :user-talk-notes="talkNotesHook" />
                          <talk-favorite-button v-if="confDescriptor" :conf-descriptor="confDescriptor" :user-talk-notes="talkNotesHook" />
                        </template>
                      </schedule-talk>
                    </template>
                  </talk-format-groups-breakdown>
                </div>
              </template>
            </time-slot-section>
          </template>
        </timeslots-iterator>
      </ion-accordion-group>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {useRoute} from "vue-router";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {ref, watch} from "vue";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import DaySelector from "@/components/schedule/DaySelector.vue";
  import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
  import ScheduleBreak from "@/components/schedule/ScheduleBreak.vue";
  import TimeslotsIterator from "@/components/timeslots/TimeslotsIterator.vue";
  import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
  import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
  import {IonAccordionGroup} from "@ionic/vue";
  import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
  import TalkFormatGroupsBreakdown from "@/components/schedule/TalkFormatGroupsBreakdown.vue";
  import {
      VoxxrinScheduleTimeSlot
  } from "@/models/VoxxrinSchedule";
  import {useSchedule} from "@/state/useSchedule";
  import {useTabbedPageNav} from "@/state/useTabbedPageNav";
  import {VoxxrinTalk} from "@/models/VoxxrinTalk";
  import {findBestAutoselectableConferenceDay} from "@/models/VoxxrinConferenceDescriptor";
  import {useUserEventAllFavoritedTalkIds} from "@/state/useUserTalkNotes";
  import TimeSlotSection from "@/components/timeslots/TimeSlotSection.vue";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

  const currentlySelectedDayId = ref<DayId|undefined>(undefined)
  const changeDayTo = (day: VoxxrinDay) => {
      currentlySelectedDayId.value = day.id;
  }

  const { schedule: currentSchedule } = useSchedule(confDescriptor, currentlySelectedDayId)
  const { allUserFavoritedTalkIds } = useUserEventAllFavoritedTalkIds(eventId)

  const expandedTimeslotIds = ref<string[]>([])
  function toggleExpandedTimeslot(timeslot: VoxxrinScheduleTimeSlot) {
      const expandedTimeslotIdsIndex = expandedTimeslotIds.value.indexOf(timeslot.id.value)
      if(expandedTimeslotIdsIndex === -1) {
          expandedTimeslotIds.value.push(timeslot.id.value);
      } else {
          expandedTimeslotIds.value.splice(expandedTimeslotIdsIndex, 1);
      }
  }

  watch([confDescriptor, currentlySelectedDayId], ([confDescriptor, selectedDayId]) => {
      console.debug(`current conf descriptor changed`, confDescriptor, selectedDayId)
      if (confDescriptor && !selectedDayId) {
          currentlySelectedDayId.value = findBestAutoselectableConferenceDay(confDescriptor).id;
      }
  }, {immediate: true})


  const { triggerTabbedPageNavigate } = useTabbedPageNav();

  async function navigateToTimeslotFeedbackCreation(timeslot: VoxxrinScheduleTimeSlot) {
      triggerTabbedPageNavigate(`/events/${eventId.value.value}/new-feedback-for-timeslot/${timeslot.id.value}`, "forward", "push");
  }
  async function openTalkDetails(talk: VoxxrinTalk) {
      if(talk) {
          triggerTabbedPageNavigate(`/events/${eventId.value}/talks/${talk.id.value}/details`, "forward", "push");
      }
  }
</script>

<style lang="scss" scoped>
  .room {
    flex: 0 0 auto;
    padding: 4px 12px;
    text-align: center;
    background-color: var(--app-primary);
    color: var(--app-primary-contrast);
    font-weight: bold;
    border-radius: 0 0 10px 10px;
  }
</style>
