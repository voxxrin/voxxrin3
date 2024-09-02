<template>
  <time-slot-section :timeslot="timeslot" :conf-descriptor="confDescriptor">
    <template #section-content>
      <schedule-break v-if="timeslot.type==='break'" :conf-descriptor="confDescriptor" :talk-break="timeslot.break"></schedule-break>
      <div v-if="timeslot.type === 'talks'">
        <no-results illu-path="images/svg/illu-no-favorites.svg" v-if="timeslot.talks.filter(t => t.id.isIncludedIntoArray(favoritedTalkIdsRef)).length === 0">
          <template #title>{{ LL.No_favorites_defined_yet() }}</template>
        </no-results>
        <talk-format-groups-breakdown :conf-descriptor="confDescriptor" v-if="timeslot.type==='talks'" :talks="timeslot.talks.filter(t => t.id.isIncludedIntoArray(favoritedTalkIdsRef))">
          <template #talk="{ talk }">
            <schedule-talk :talk="talk" :talk-stats="talkStatsRefByTalkId.get(talk.id.value)" :talk-notes="userEventTalkNotes.get(talk.id.value)"
                           :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor"
                           :room-stats="roomsStatsRefByRoomId?.[talk.room.id.value]" :is-upcoming-talk="upcomingRawTalkIds.includes(talk.id.value)"
                           @talk-clicked="talk => $emit('talk-clicked', talk)" >
              <template #upper-right="{ talk }">
                <div class="room" v-if="confDescriptor?.features.roomsDisplayed">
                  {{talk.room.title}}
                </div>
              </template>
              <template #footer-actions="{ talk, talkNotes, talkStats }">
                <provide-feedback-talk-button v-if="!talk.isOverflow"
                                              :conf-descriptor="confDescriptor" :timeslot-progress-status="progress?.status"
                                              :timeslot-feedback="timeslot.feedback" @click.stop="() => $emit('provide-talk-feedback-clicked', talk)" />
                <talk-watch-later-button v-if="confDescriptor && !talk.isOverflow"
                                         :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes"
                                         @talk-note-updated="updatedTalkNote => userEventTalkNotes.set(talk.id.value, updatedTalkNote) " />

                <talk-favorite-button v-if="confDescriptor && !talk.isOverflow"
                                      :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes" :talk-stats="talkStats"
                                      :local-favorite="localEventTalkNotes.get(talk.id.value)"
                />
              </template>
            </schedule-talk>
          </template>
        </talk-format-groups-breakdown>
      </div>
    </template>
  </time-slot-section>

</template>

<script setup lang="ts">
import {IonButton} from "@ionic/vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TimeslotAnimations} from "@/services/Animations";
import TimeSlotAccordion from "@/components/timeslots/TimeSlotAccordion.vue";
import TalkFormatGroupsBreakdown from "@/components/schedule/TalkFormatGroupsBreakdown.vue";
import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
import ScheduleBreak from "@/components/schedule/ScheduleBreak.vue";
import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
import TalkRoom from "@/components/talk-card/TalkRoom.vue";
import ProvideFeedbackTalkButton from "@/components/talk-card/ProvideFeedbackTalkButton.vue";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import {computed, PropType, toValue} from "vue";
import {LabelledTimeslotWithFeedback} from "@/state/useSchedule";
import {TimeslotTimingProgress, VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {TalkStats} from "../../../../shared/event-stats";
import {VoxxrinRoomStats} from "@/models/VoxxrinRoomStats";
import {TalkNote} from "../../../../shared/feedbacks.firestore";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import NoResults from "@/components/ui/NoResults.vue";
import TimeSlotSection from "@/components/timeslots/TimeSlotSection.vue";
const { LL } = typesafeI18n()

const props = defineProps({
  confDescriptor: {
    required: true,
    type: Object as PropType<VoxxrinConferenceDescriptor>,
  },
  timeslot: {
    required: true,
    type: Object as PropType<LabelledTimeslotWithFeedback>,
  },
  progress: {
    required: true,
    type: Object as PropType<TimeslotTimingProgress|undefined>,
  },
  upcomingRawTalkIds: {
    required: true,
    type: Object as PropType<string[]>
  },
  talkStatsRefByTalkId: {
    required: true,
    type: Object as PropType<Map<string, TalkStats>>
  },
  roomsStatsRefByRoomId: {
    required: true,
    type: Object as PropType<{ [roomId: string ]: VoxxrinRoomStats }|undefined>
  },
  userEventTalkNotes: {
    required: true,
    type: Object as PropType<Map<string, TalkNote>>
  },
  localEventTalkNotes: {
    required: true,
    type: Object as PropType<Map<string, 1|-1>>
  },
})

const $emits = defineEmits<{
  (e: 'talk-clicked', talk: VoxxrinTalk): void,
  (e: 'provide-talk-feedback-clicked', talk: VoxxrinTalk): void,
}>()

const favoritedTalkIdsRef = computed(() => {
  const userEventTalkNotes = toValue(props.userEventTalkNotes)
  return Array.from(userEventTalkNotes.values())
    .filter(talkNotes => talkNotes.isFavorite)
    .map(talkNotes => new TalkId(talkNotes.talkId))
})
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
