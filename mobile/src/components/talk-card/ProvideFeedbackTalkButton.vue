<template>
  <div class="talkAction" v-if="provideFeedbackButtonShown">
    <ion-button class="btnTalk btn-feedback" aria-label="LL.Add_Feedback()">
      <span class="btn-favorite-group">
        <ion-icon class="btn-feedback-group-icon" aria-hidden="true" src="/assets/icons/line/comment-line-add.svg"></ion-icon>
      </span>
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType, toValue} from "vue";
import {
    areFeedbacksEnabled,
    VoxxrinConferenceDescriptor
} from "@/models/VoxxrinConferenceDescriptor";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {TimeslotTimingProgress} from "@/models/VoxxrinSchedule";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {typesafeI18n} from "@/i18n/i18n-vue";
const { LL } = typesafeI18n()

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>,
    },
    timeslotProgressStatus: {
        required: false,
        type: String as PropType<TimeslotTimingProgress['status']|undefined>
    },
    timeslotFeedback: {
        required: true,
        type: Object as PropType<VoxxrinTimeslotFeedback>
    }
});

const provideFeedbackButtonShown = computed(() => {
    const confDescriptor = toValue(props.confDescriptor),
        timeslotFeedbackAlreadyProvided = toValue(props.timeslotFeedback),
        timeslotProgressStatus = toValue(props.timeslotProgressStatus);

    if(!confDescriptor) {
        return false;
    }
    
    return (timeslotFeedbackAlreadyProvided === undefined || timeslotFeedbackAlreadyProvided.status === 'missing')
        && (timeslotProgressStatus === 'past' || timeslotProgressStatus === 'ongoing')
        && areFeedbacksEnabled(confDescriptor)
        && !confDescriptor.features.remindMeOnceVideosAreAvailableEnabled;
})

const emits = defineEmits<{
    (e: 'talkFeedbackClicked', talk: VoxxrinTalk): void,
}>()
</script>

<style scoped lang="scss">
.btn-feedback {
  --size: 28px;

  --background: var(--voxxrin-event-theme-colors-secondary-hex);
  --color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);

  &-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 2px;

    &-icon {
      position: relative;
      font-size: 26px;
    }

    &-nb {
      font-size: 14px !important;
      font-weight: 700;
    }
  }
}
</style>
