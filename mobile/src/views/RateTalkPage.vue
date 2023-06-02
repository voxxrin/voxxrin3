
<template>
  <ion-page v-if="confDescriptorRef && labelledTimeslotAndScheduleAndTalkRef">
    <base-feedback-step :step="2" :step-label="LL.Share_your_feedback()"
                        :conf-descriptor="confDescriptorRef" :labelled-timeslot="labelledTimeslotAndScheduleAndTalkRef.labelledTimeslot">
      <slot>
        <schedule-talk :is-highlighted="() => false" :talk="labelledTimeslotAndScheduleAndTalkRef.talk">
        </schedule-talk>

        TODO: add rating modal sheet
      </slot>
    </base-feedback-step>
  </ion-page>
</template>

<script setup lang="ts">
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TalkId} from "@/models/VoxxrinTalk";
import BaseFeedbackStep from "@/components/BaseFeedbackStep.vue";
import {
    useFindLabelledTimeslotContainingTalk
} from "@/state/useFindTimeslot";
import ScheduleTalk from "@/components/ScheduleTalk.vue";

const { LL } = typesafeI18n()

const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = new TalkId(getRouteParamsValue(route, 'talkId'));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const {labelledTimeslotAndScheduleAndTalkRef} = useFindLabelledTimeslotContainingTalk(confDescriptorRef.value!, talkId);

</script>

<style scoped lang="scss">
</style>
