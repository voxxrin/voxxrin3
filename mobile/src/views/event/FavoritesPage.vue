<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header :conf-descriptor="confDescriptor" />
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start" >{{ LL.Favorites() }}</ion-title>
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
          <template #iterator="{ timeslot, progress, upcomingRawTalkIds }">
            <time-slot-section :timeslot="timeslot" :conf-descriptor="confDescriptor">
              <template #section-content>
                <schedule-break v-if="timeslot.type==='break'" :conf-descriptor="confDescriptor" :talk-break="timeslot.break"></schedule-break>
                <div v-if="timeslot.type === 'talks'">
                  <no-results illu-path="images/svg/illu-no-favorites.svg" v-if="timeslot.talks.filter(t => t.id.isIncludedIntoArray(favoritedTalkIdsRef)).length === 0">
                    <template #title>{{ LL.No_favorites_defined_yet() }}</template>
                  </no-results>
                  <talk-format-groups-breakdown :conf-descriptor="confDescriptor" v-if="timeslot.type==='talks'" :talks="timeslot.talks.filter(t => t.id.isIncludedIntoArray(favoritedTalkIdsRef))">
                    <template #talk="{ talk }">
                      <schedule-talk :talk="talk" :talk-stats="talkStatsRefByTalkId.get(talk.id.value)" :talk-notes="userEventTalkNotesRef.get(talk.id.value)"
                                     :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor"
                                     :room-stats="roomsStatsRefByRoomId?.[talk.room.id.value]" :is-upcoming-talk="upcomingRawTalkIds.includes(talk.id.value)"
                                     @talkClicked="openTalkDetails($event)" >
                        <template #upper-right="{ talk }">
                          <div class="room" v-if="confDescriptor?.features.roomsDisplayed">
                            {{talk.room.title}}
                          </div>
                        </template>
                        <template #footer-actions="{ talk, talkNotes, talkStats }">
                          <provide-feedback-talk-button v-if="!talk.isOverflow"
                            :conf-descriptor="confDescriptor" :timeslot-progress-status="progress?.status"
                            :timeslot-feedback="timeslot.feedback" @click.stop="navigateToTalkRatingScreenFor(talk)" />
                          <talk-watch-later-button v-if="confDescriptor && !talk.isOverflow"
                             :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes"
                             @talk-note-updated="updatedTalkNote => userEventTalkNotesRef.set(talk.id.value, updatedTalkNote) " />

                          <talk-favorite-button v-if="confDescriptor && !talk.isOverflow"
                              :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes" :talk-stats="talkStats"
                              :local-favorite="localEventTalkNotesRef.get(talk.id.value)"
                          />
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
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {managedRef as ref} from "@/views/vue-utils";
  import DaySelector from "@/components/schedule/DaySelector.vue";
  import ScheduleBreak from "@/components/schedule/ScheduleBreak.vue";
  import TimeslotsIterator from "@/components/timeslots/TimeslotsIterator.vue";
  import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
  import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
  import {IonAccordionGroup} from "@ionic/vue";
  import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
  import TalkFormatGroupsBreakdown from "@/components/schedule/TalkFormatGroupsBreakdown.vue";
  import {
      extractTalksFromSchedule,
      VoxxrinScheduleTimeSlot
  } from "@/models/VoxxrinSchedule";
  import {useSchedule} from "@/state/useSchedule";
  import {useTabbedPageNav} from "@/state/useTabbedPageNav";
  import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
  import {useLocalEventTalkFavsStorage, useUserEventTalkNotes} from "@/state/useUserTalkNotes";
  import TimeSlotSection from "@/components/timeslots/TimeSlotSection.vue";
  import {useSharedEventSelectedDay} from "@/state/useEventSelectedDay";
  import {computed, toValue} from "vue";
  import {useEventTalkStats} from "@/state/useEventTalkStats";
  import NoResults from "@/components/ui/NoResults.vue";
  import ProvideFeedbackTalkButton from "@/components/talk-card/ProvideFeedbackTalkButton.vue";
  import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";
  import {useRoomsStats} from "@/state/useRoomsStats";
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

  const {firestoreEventTalkStatsRef: talkStatsRefByTalkId} = useEventTalkStats(spacedEventIdRef, talkIdsRef)
  const {userEventTalkNotesRef } = useUserEventTalkNotes(spacedEventIdRef, talkIdsRef)
  const localEventTalkNotesRef = useLocalEventTalkFavsStorage(spacedEventIdRef);
  const {firestoreRoomsStatsRef: roomsStatsRefByRoomId } = useRoomsStats(spacedEventIdRef)

  const favoritedTalkIdsRef = computed(() => {
      const userEventTalkNotes = toValue(userEventTalkNotesRef)
      return Array.from(userEventTalkNotes.values())
          .filter(talkNotes => talkNotes.isFavorite)
          .map(talkNotes => new TalkId(talkNotes.talkId))
  })

  const expandedTimeslotIds = ref<string[]>([])

  const { triggerTabbedPageNavigate } = useTabbedPageNav();

  async function navigateToTimeslotFeedbackCreation(timeslot: VoxxrinScheduleTimeSlot) {
      triggerTabbedPageNavigate(`${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/new-feedback-for-timeslot/${timeslot.id.value}`, "forward", "push");
  }
  async function openTalkDetails(talk: VoxxrinTalk) {
      if(talk) {
          triggerTabbedPageNavigate(`${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/talks/${talk.id.value}/details`, "forward", "push");
      }
  }
  async function navigateToTalkRatingScreenFor(talk: VoxxrinTalk) {
      triggerTabbedPageNavigate(`${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/rate-talk/${talk.id.value}`, "forward", "push");
  }
</script>

<style lang="scss" scoped>
  .room {
    position: relative;
    top: -8px;
    flex: 0 0 auto;
    padding: 4px 12px;
    text-align: center;
    background-color: var(--app-primary);
    color: var(--app-primary-contrast);
    font-weight: bold;
    border-radius: 0 0 10px 10px;
  }
</style>
