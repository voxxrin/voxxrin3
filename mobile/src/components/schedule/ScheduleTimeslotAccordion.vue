<template>
  <time-slot-accordion
    :animation-delay="timeslotIndex*TimeslotAnimations.ANIMATION_BASE_DELAY.total('milliseconds')"
    :timeslot-feedback="timeslot.feedback" :timeslot="timeslot" :conf-descriptor="confDescriptor"
    :elements-shown="['add-feedback-btn']"
    :progress="progress"
    @add-timeslot-feedback-clicked="(ts) => $emit('add-timeslot-feedback-clicked', ts)"
    @click="() => $emits('time-slot-accordion-clicked', timeslot)">
    <template #accordion-content="{ timeslot, progressStatus, feedback }">
      <schedule-break v-if="timeslot.type==='break'" :conf-descriptor="confDescriptor" :talk-break="timeslot.break"></schedule-break>
      <talk-format-groups-breakdown :conf-descriptor="confDescriptor" v-if="timeslot.type==='talks'"
                                    :talks="timeslot.talks">
        <template #talk="{ talk }">
          <ion-item class="listTalks-item" role="listitem">
            <schedule-talk :talk="talk" :talk-stats="talkStatsRefByTalkId.get(talk.id.value)"
                           :room-stats="roomsStatsRefByRoomId?.[talk.room.id.value]" :is-upcoming-talk="upcomingRawTalkIds.includes(talk.id.value)"
                           :talk-notes="userEventTalkNotes.get(talk.id.value)" @talk-clicked="(clickedTalk) => $emit('talk-clicked', clickedTalk)" :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor">
              <template #upper-right="{ talk }">
                <talk-room :talk="talk" :conf-descriptor="confDescriptor" />
              </template>
              <template #footer-actions="{ talk, talkStats, talkNotes }">
                <provide-feedback-talk-button v-if="!talk.isOverflow"
                                              :conf-descriptor="confDescriptor" :timeslot-progress-status="progressStatus"
                                              :timeslot-feedback="feedback" @click.stop="() => $emit('provide-talk-feedback-clicked', talk)" />
                <talk-watch-later-button v-if="confDescriptor && !hideWatchLater && !talk.isOverflow"
                                         :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes"
                                         @talk-note-updated="updatedTalkNote => userEventTalkNotes.set(talk.id.value, updatedTalkNote) " />
                <talk-favorite-button v-if="confDescriptor && !talk.isOverflow"
                                      :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes" :talk-stats="talkStats"
                                      :local-favorite="localEventTalkNotes.get(talk.id.value)"
                                      @talk-note-updated="updatedTalkNote => userEventTalkNotes.set(talk.id.value, updatedTalkNote) " />
              </template>
            </schedule-talk>
          </ion-item>
        </template>
      </talk-format-groups-breakdown>
    </template>
  </time-slot-accordion>
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
import {PropType} from "vue";
import {LabelledTimeslotWithFeedback} from "@/state/useSchedule";
import {TimeslotTimingProgress, VoxxrinScheduleTimeSlot} from "@/models/VoxxrinSchedule";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {TalkStats} from "../../../../shared/event-stats";
import {VoxxrinRoomStats} from "@/models/VoxxrinRoomStats";
import {TalkNote} from "../../../../shared/feedbacks.firestore";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
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
  timeslotIndex: {
    required: true,
    type: Number,
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
  hideWatchLater: {
    require: true,
    type: Boolean,
  },
})

const $emits = defineEmits<{
  (e: 'time-slot-accordion-clicked', timeslot: LabelledTimeslotWithFeedback): void,
  (e: 'add-timeslot-feedback-clicked', timeslot: VoxxrinScheduleTimeSlot): void,
  (e: 'talk-clicked', talk: VoxxrinTalk): void,
  (e: 'provide-talk-feedback-clicked', talk: VoxxrinTalk): void,
}>()
</script>

<style lang="scss" scoped>
:deep(.listTalks-item) {
  overflow: visible !important;
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
  --border-style: none;

  &:last-child {
    margin-bottom: var(--app-gutters);
  }
}
</style>
