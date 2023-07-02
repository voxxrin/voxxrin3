
<template>
  <ion-page v-if="confDescriptorRef && labelledTimeslotWithTalkRef">
    <ion-content>
      <base-feedback-step :step="2" :step-label="LL.Share_your_feedback()"
                          :conf-descriptor="confDescriptorRef" :labelled-timeslot="labelledTimeslotWithTalkRef.labelledTimeslot">
        <slot>
          <div class="rateTalkView">
            <div class="rateTalkView-head">
              <schedule-talk :event="confDescriptorRef" :is-highlighted="() => false" :talk="labelledTimeslotWithTalkRef.talk">
              </schedule-talk>
            </div>

            <div class="rateTalkForm">
              <vox-divider v-if="confDescriptorRef.features.ratings.scale.enabled || confDescriptorRef.features.ratings['custom-scale'].enabled">
                {{ LL.Rate_it() }} :
              </vox-divider >

              <linear-rating
                  v-if="confDescriptorRef.features.ratings.scale.enabled"
                  :config="confDescriptorRef.features.ratings.scale"
                  @rating-selected="feedback.ratings['linear-rating'] = $event?.score"
              ></linear-rating>
              <icon-based-rating
                  v-if="confDescriptorRef.features.ratings['custom-scale'].enabled"
                  :config="confDescriptorRef.features.ratings['custom-scale']"
                  @rating-selected="feedback.ratings['custom-rating'] = $event"
              ></icon-based-rating>

              <vox-divider v-if="confDescriptorRef.features.ratings.bingo.enabled">
                {{ LL.Quick_feedback() }} :
              </vox-divider>

              <quick-feedback-rating
                  v-if="confDescriptorRef.features.ratings.bingo.enabled"
                  :config="confDescriptorRef.features.ratings.bingo"
                  @rating-selected="feedback.ratings['bingo'] = $event"
              ></quick-feedback-rating>

              <vox-divider v-if="confDescriptorRef.features.ratings['free-text'].enabled">
                {{ LL.Free_comment() }} :
              </vox-divider>

              <ion-textarea v-if="confDescriptorRef.features.ratings['free-text'].enabled"
                  :debounce="300" :maxlength="confDescriptorRef.features.ratings['free-text'].maxLength"
                  @ionInput="(ev) => feedback.comment = ''+ev.target.value"
                  aria-label="Custom input" :placeholder="LL.Enter_some_constructive_feedback_for_the_speaker()" auto-grow>
              </ion-textarea>
            </div>
          </div>

        </slot>
      </base-feedback-step>
    </ion-content>
    <ion-footer class="feedBackFooter">
      <ion-toolbar>
        <div class="feedBackFooter-group">
          <ion-button size="small" fill="solid" color="medium" shape="round" expand="block">{{ LL.Cancel() }}</ion-button>
          <ion-button size="small" shape="round" color="tertiary" expand="block"
                @click="submitFeedback()"
                :disabled="!feedbackCanBeSubmitted">
            {{ LL.Submit_Feedback() }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, reactive, Ref, ref, unref, watch} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TalkId} from "@/models/VoxxrinTalk";
import BaseFeedbackStep from "@/components/BaseFeedbackStep.vue";
import {
    findLabelledTimeslotContainingTalk,
    DailyLabelledTimeslotWithTalk,
} from "@/state/findTimeslot";
import ScheduleTalk from "@/components/ScheduleTalk.vue";
import {IonFooter, IonInput, IonTextarea} from "@ionic/vue";
import LinearRating from "@/components/ratings/LinearRating.vue";
import QuickFeedbackRating from "@/components/ratings/QuickFeedbackRating.vue";
import IconBasedRating from "@/components/ratings/IconBasedRating.vue";
import {UserFeedback} from "../../../../shared/feedbacks.firestore";
import {UnwrapNestedRefs} from "@vue/reactivity";
import {useUserFeedbacks} from "@/state/useUserFeedbacks";
import {ScheduleTimeSlotId} from "@/models/VoxxrinSchedule";
import VoxDivider from "@/components/ui/VoxDivider.vue";

const { LL } = typesafeI18n()

const route = useRoute();
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = new TalkId(getRouteParamsValue(route, 'talkId'));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const labelledTimeslotWithTalkRef = ref<undefined | DailyLabelledTimeslotWithTalk>(undefined);
const dayIdRef = computed(() => {
    const labelledTimeslotWithTalk = unref(labelledTimeslotWithTalkRef);
    return labelledTimeslotWithTalk?.dayId;
})

const feedback: UnwrapNestedRefs<UserFeedback> = reactive({
    timeslotId: '',
    talkId: talkId.value,
    ratings: {
        'linear-rating': null,
        'bingo': [],
        'custom-rating': null
    },
    comment: null
})

watch([confDescriptorRef], async ([confDescriptor]) => {
    if(!confDescriptor) {
        labelledTimeslotWithTalkRef.value = undefined;
        return;
    }

    const labelledTimeslotWithTalk = await findLabelledTimeslotContainingTalk(confDescriptor, talkId);
    labelledTimeslotWithTalkRef.value = labelledTimeslotWithTalk;
    if(labelledTimeslotWithTalk) {
        feedback.timeslotId = labelledTimeslotWithTalk.labelledTimeslot.id.value;
    }
}, { immediate: true })

const feedbackCanBeSubmitted = computed(() => {
    const confDescriptor = unref(confDescriptorRef);
    if(!confDescriptor) {
        return false;
    }

    if(confDescriptor.features.ratings.bingo.enabled && feedback.ratings.bingo.length===0) {
        return false;
    }
    if(confDescriptor.features.ratings.scale.enabled && feedback.ratings["linear-rating"] === null) {
        return false;
    }
    if(confDescriptor.features.ratings["custom-scale"].enabled && feedback.ratings["custom-rating"] === null) {
        return false;
    }
    if(confDescriptor.features.ratings["free-text"].enabled
        && !confDescriptor.features.ratings["bingo"].enabled
        && !confDescriptor.features.ratings["scale"].enabled
        && !confDescriptor.features.ratings["custom-scale"].enabled
        && (feedback.comment?.length === undefined || feedback.comment.length < 3)) {
        return false;
    }

    return true;
})

const {userFeedbacks, updateTimeslotFeedback} = useUserFeedbacks(eventIdRef, dayIdRef);

async function submitFeedback() {
    const labelledTimeslotWithTalk = unref(labelledTimeslotWithTalkRef);
    if(!labelledTimeslotWithTalk) {
        throw new Error(`Unexpected state: submitFeedback() called with empty labelledTimeslotWithTalk`)
    }

    await updateTimeslotFeedback(labelledTimeslotWithTalk.labelledTimeslot.id, labelledTimeslotWithTalk.talk.id, feedback);
}

</script>

<style scoped lang="scss">
.scaled-element {
  transform-origin: top left;
  transform: scale(var(--scale-value, 1));
}

.rateTalkView {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--app-primary);

  &-head {
    position: sticky;
    top: 116px;
    padding: var(--app-gutters);

    .talkCard {margin: 0;}
  }
}

.rateTalkForm {
  flex: 1;
  position: relative;
  padding: 24px var(--app-gutters) var(--app-gutters) var(--app-gutters);
  border-radius: 16px 16px 0 0;
  background-color: var(--app-background);
  box-shadow: rgba(0, 0, 0, 0.25) 0px 1px 55px, rgba(0, 0, 0, 0.12) -3px -15px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 1px -5px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
  z-index: 1;

  @media (prefers-color-scheme: dark) {
    background-color: var(--app-dark-contrast);
    border: 1px solid var(--app-line-contrast);
  }
}
</style>
