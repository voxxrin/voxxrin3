
<template>
  <ion-page v-if="confDescriptorRef && labelledTimeslotAndScheduleAndTalkRef">
    <ion-content>
      <base-feedback-step :step="2" :step-label="LL.Share_your_feedback()"
                          :conf-descriptor="confDescriptorRef" :labelled-timeslot="labelledTimeslotAndScheduleAndTalkRef.labelledTimeslot">
        <slot>
          <div class="rateTalkView">
            <div class="rateTalkView-head">
              <schedule-talk :is-highlighted="() => false" :talk="labelledTimeslotAndScheduleAndTalkRef.talk">
              </schedule-talk>
            </div>

            <div class="rateTalkForm" v-if="confDescriptorRef.features.ratings.scale.enabled">
              <div class="divider">
                <span class="titleDivider">{{ LL.Rate_it() }} :</span>
                <span class="divider-separator"></span>
              </div>

              <feedback-linear-rating
                  v-if="confDescriptorRef.features.ratings.scale.enabled"
                  :config="confDescriptorRef.features.ratings.scale"
                  @rating-selected="ratings['linear-rating'] = $event.score"
              ></feedback-linear-rating>

              <div class="divider">
                <span class="titleDivider">Quick feedback :</span>
                <span class="divider-separator"></span>
              </div>

              <ion-list>
                <ion-item>
                  <ion-checkbox justify="space-between">Too mush code</ion-checkbox>
                </ion-item>
                <ion-item>
                  <ion-checkbox justify="space-between">Very interesting</ion-checkbox>
                </ion-item>
                <ion-item>
                  <ion-checkbox justify="space-between">Tool long</ion-checkbox>
                </ion-item>
                <ion-item>
                  <ion-checkbox justify="space-between">Amazing speakers</ion-checkbox>
                </ion-item>
                <ion-item>
                  <ion-checkbox justify="space-between">I learnt something</ion-checkbox>
                </ion-item>
              </ion-list>

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
import {computed, reactive} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TalkId} from "@/models/VoxxrinTalk";
import BaseFeedbackStep from "@/components/BaseFeedbackStep.vue";
import {
    useFindLabelledTimeslotContainingTalk
} from "@/state/useFindTimeslot";
import ScheduleTalk from "@/components/ScheduleTalk.vue";
import {IonCheckbox, IonFooter, IonTextarea} from "@ionic/vue";
import FeedbackLinearRating from "@/components/ratings/FeedbackLinearRating.vue";

const { LL } = typesafeI18n()

const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
const eventIdRef = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = new TalkId(getRouteParamsValue(route, 'talkId'));
const {conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(eventIdRef);

const {labelledTimeslotAndScheduleAndTalkRef} = useFindLabelledTimeslotContainingTalk(confDescriptorRef.value!, talkId);

const ratings = reactive({
    'linear-rating': undefined as number|undefined
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
