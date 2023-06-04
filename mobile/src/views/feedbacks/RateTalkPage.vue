
<template>
  <ion-page v-if="confDescriptorRef && labelledTimeslotWithTalkRef">
    <ion-content>
      <base-feedback-step :step="2" :step-label="LL.Share_your_feedback()"
                          :conf-descriptor="confDescriptorRef" :labelled-timeslot="labelledTimeslotWithTalkRef.labelledTimeslot">
        <slot>
          <div class="rateTalkView">
            <div class="rateTalkView-head">
              <schedule-talk :is-highlighted="() => false" :talk="labelledTimeslotWithTalkRef.talk">
              </schedule-talk>
            </div>

            <div class="rateTalkForm" v-if="confDescriptorRef.features.ratings.scale.enabled">
              <div class="divider">
                <span class="titleDivider">{{ LL.Rate_it() }} :</span>
                <span class="divider-separator"></span>
              </div>

              <linear-rating
                  v-if="confDescriptorRef.features.ratings.scale.enabled"
                  :config="confDescriptorRef.features.ratings.scale"
                  @rating-selected="ratings['linear-rating'] = $event.score"
              ></linear-rating>

              <div class="divider">
                <span class="titleDivider">{{ LL.Quick_feedback() }} :</span>
                <span class="divider-separator"></span>
              </div>

              <quick-feedback-rating
                  v-if="confDescriptorRef.features.ratings.bingo.enabled"
                  :config="confDescriptorRef.features.ratings.bingo"
                  @rating-selected="ratings['bingo'] = $event"
              ></quick-feedback-rating>

              <div class="divider">
                <span class="titleDivider">Free comment :</span>
                <span class="divider-separator"></span>
              </div>

              <ion-textarea aria-label="Custom input"
                            placeholder="Enter text"
                            auto-grow>
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
          <ion-button size="small" shape="round" color="tertiary" expand="block">
            Submit Feedback
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
import {computed, reactive, ref, watch} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TalkId} from "@/models/VoxxrinTalk";
import BaseFeedbackStep from "@/components/BaseFeedbackStep.vue";
import {
    findLabelledTimeslotContainingTalk,
    LabelledTimeslotWithTalk,
} from "@/state/findTimeslot";
import ScheduleTalk from "@/components/ScheduleTalk.vue";
import {IonFooter, IonTextarea} from "@ionic/vue";
import LinearRating from "@/components/ratings/LinearRating.vue";
import QuickFeedbackRating from "@/components/ratings/QuickFeedbackRating.vue";

const { LL } = typesafeI18n()

const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = new TalkId(getRouteParamsValue(route, 'talkId'));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const labelledTimeslotWithTalkRef = ref<undefined | LabelledTimeslotWithTalk>(undefined);

const ratings = reactive({
    'linear-rating': undefined as number|undefined,
    bingo: [] as string[],
})

watch([confDescriptorRef], async ([confDescriptor]) => {
    if(!confDescriptor) {
        labelledTimeslotWithTalkRef.value = undefined;
        return;
    }

    const labelledTimeslotWithTalk = await findLabelledTimeslotContainingTalk(confDescriptor, talkId);
    labelledTimeslotWithTalkRef.value = labelledTimeslotWithTalk;
})

</script>

<style scoped lang="scss">
.scaled-element {
  transform-origin: top left;
  transform: scale(var(--scale-value, 1));
}

.rateTalkView {
  background: var(--app-primary);

  &-head {
    position: sticky;
    top: 116px;
    padding: var(--app-gutters);

    .talkCard {margin: 0;}
  }
}

.rateTalkForm {
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

  ion-list {
    padding-top: 0;
    background: transparent;

    ion-item {
      --background: transparent;
      --padding-end: 0;

      &:last-child {
        --border-style: none;
      }
    }
  }
}
</style>
