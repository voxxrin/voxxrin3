<template>
  <ion-page v-themed-event-styles="confDescriptor">
    <ion-content v-if="confDescriptorRef && talkFeedbacksStats && detailedTalk">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/talks`)"
                      :aria-label="LL.Close()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">{{LL.Talk_Feedbacks()}}</ion-title>
          <span class="eventLogo"></span>
        </ion-toolbar>
      </ion-header>

      <talk-details-header :conf-descriptor="confDescriptorRef" :talk="detailedTalk"></talk-details-header>

      <div class="TalkFeedBacksContent">
        <h4 class="TalkFeedBacksContent-title">{{LL.Talk_Feedbacks()}}</h4>
        <div v-if="talkFeedbacksStats.count>0">
          <vox-divider>{{LL.Stats()}}</vox-divider>
          <div class="TalkFeedBacksStats">
            <div class="statGroup">
                <div class="stat">
                  <span class="stat-label">{{LL.Number_of_Feedbacks()}}</span>
                  <span class="stat-value">{{talkFeedbacksStats.count}}</span>
                </div>
                <div class="stat" v-if="confDescriptorRef.features.ratings.scale.enabled">
                  <img src="/assets/images/svg/illu-feedback.svg"/>
                  <span class="stat-label">{{LL.Average_linear_ratings()}}</span>
                  <div class="stat-rate">
                    <span class="stat-rate-value">{{talkFeedbacksStats.averageLinearRating}}</span> /
                    {{confDescriptorRef.features.ratings.scale.labels.length}}
                  </div>
                <div class="stat-count">
                  <span class="stat-count-label">{{LL.votes()}}:</span>
                  {{talkFeedbacksStats.linearRatingCount}}</div>
              </div>
            </div>

            <div class="bingoContainer" v-if="confDescriptorRef.features.ratings.bingo.enabled && !confDescriptorRef.features.ratings.bingo.isPublic">
              <h6 class="privateBingo-title">{{LL.Private_Bingo()}}</h6>
              <ion-list class="privateBingo" :inset="true">
                <ion-item v-for="(bingoStat, choiceIndex) in talkFeedbacksStats.bingo" :key="choiceIndex"
                          :class="{ '_hasFeedback': bingoStat.count>0}">
                  <span class="privateBingo-count">{{bingoStat.count}}</span>
                  <ion-label>
                    {{bingoStat.choiceLabel}}
                    <ion-progress-bar :value="bingoStat.count / talkFeedbacksStats.maxBingo" />
                  </ion-label>
                </ion-item>
              </ion-list>
            </div>
          </div>
          <br>
          <br>
          <vox-divider>{{LL.Detailed_Feedbacks()}}</vox-divider>
          <ion-card class="feedback" v-for="(talkFeedback, index) in displayableTalkFeedbacks" :key="talkFeedback.attendeePublicToken">
            <div class="feedback-head">
              <ion-row>
                <ion-col size="auto">
                  <ion-icon aria-hidden="true" src="/assets/icons/line/chat-2-text-line.svg"></ion-icon>
                </ion-col>
                <ion-col>
                  <div class="feedback-id"><label>{{LL.Last_updated()}}</label> <strong>{{talkFeedback.lastUpdatedOn}}</strong></div>
                  <div class="feedback-id"><label>{{LL.Who()}}</label> <strong>{{talkFeedback.attendeePublicToken}}</strong></div>
                </ion-col>
              </ion-row>
            </div>
            <div class="feedback-content">
              <div class="feedback-content-info" v-if="confDescriptorRef.features.ratings.scale.enabled">
                <label>{{LL.Linear_rating()}}</label> <strong>{{talkFeedback.ratings['linear-rating']}}</strong>
              </div>
              <div class="feedback-content-info" v-if="confDescriptorRef.features.ratings.bingo.enabled">
                <label>{{LL.Bingo()}}</label> <strong>{{talkFeedback.ratings['bingo'].join(", ")}}</strong>
              </div>
              <div class="feedback-content-info" v-if="confDescriptorRef.features.ratings['custom-scale'].enabled">
                <label>{{LL.Custom_rating()}}</label><strong>{{talkFeedback.ratings['custom-rating']}}</strong>
              </div>
              <div class="feedback-content-info" v-if="confDescriptorRef.features.ratings['free-text'].enabled">
                <label>{{LL.Free_comment()}}</label><strong><pre>{{talkFeedback.comment}}</pre></strong>
              </div>
            </div>
          </ion-card>
        </div>
        <no-results v-if="talkFeedbacksStats.count === 0" illu-path="images/svg/illu-no-feedback.svg" class="_small">
          <template #title><em class="ion-color-secondary">{{LL.No_feedback_yet()}}</em></template>
        </no-results>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {goBackOrNavigateTo} from "@/router";
import {useIonRouter, IonProgressBar, IonCol, IonRow } from "@ionic/vue";
import {useTalkFeedbacks} from "@/state/useTalkFeedbacks";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {
  useConferenceDescriptor, useSharedConferenceDescriptor,
} from "@/state/useConferenceDescriptor";
import {computed, toValue, unref} from "vue";
import {managedRef as ref} from "@/views/vue-utils";
import {numberArrayStats, sortBy} from "@/models/utils";
import TalkDetailsHeader from "@/components/talk-details/TalkDetailsHeader.vue";
import {useSharedEventTalk} from "@/state/useEventTalk";
import {typesafeI18n} from "@/i18n/i18n-vue";
import VoxDivider from "@/components/ui/VoxDivider.vue";
import NoResults from "@/components/ui/NoResults.vue";

const ionRouter = useIonRouter();
const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = ref(new TalkId(getRouteParamsValue(route, 'talkId')));
const secretFeedbacksViewerToken = ref(getRouteParamsValue(route, 'secretFeedbacksViewerToken'));

const {conferenceDescriptor: confDescriptorRef} = useConferenceDescriptor(eventId);
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
const { talkDetails: detailedTalk } = useSharedEventTalk(confDescriptorRef, talkId);

const { LL } = typesafeI18n()

const {firestoreTalkFeedbacksByPublicUserIdRef} = useTalkFeedbacks(eventId, talkId, secretFeedbacksViewerToken);
const displayableTalkFeedbacks = computed(() => {
    const firestoreTalkFeedbacksByPublicUserId = unref(firestoreTalkFeedbacksByPublicUserIdRef);
    const confDescriptor = unref(confDescriptorRef);

    if(!confDescriptor) {
        return [];
    }

    const choiceLabelsById = (confDescriptor.features.ratings.bingo.choices || []).reduce((choiceLabelsById, choice) => {
        choiceLabelsById.set(choice.id, choice.label);
        return choiceLabelsById;
    }, new Map<string,string>())

    return sortBy(Array.from(firestoreTalkFeedbacksByPublicUserId.values()).map(tf => ({
        ...tf,
        ratings: {
            ...tf.ratings,
            bingo: tf.ratings.bingo.map(choiceId => choiceLabelsById.get(choiceId))
        }
    })), tf => -Date.parse(tf.lastUpdatedOn))
})

const talkFeedbacksStats = computed(() => {
    const firestoreTalkFeedbacksByPublicUserId = toValue(firestoreTalkFeedbacksByPublicUserIdRef);
    const confDescriptor = unref(confDescriptorRef);

    if(!confDescriptor) {
        return undefined;
    }

    const feedbacks = Array.from(firestoreTalkFeedbacksByPublicUserId.values());

    const linearRatingsStats = numberArrayStats(feedbacks.map(f => f.ratings["linear-rating"]))

    const bingo = sortBy(confDescriptor.features.ratings.bingo.choices.reduce((bingo, choice) => {
        bingo.push({
            choiceId: choice.id,
            choiceLabel: choice.label,
            count: feedbacks.filter(f => (f.ratings['bingo'] || []).includes(choice.id)).length
        })
        return bingo;
    }, [] as Array<{ choiceId: string, choiceLabel: string, count: number }>),
      (bingo) => -bingo.count
    );

    const maxBingo = Math.max(...bingo.map(b => b.count))

    return {
        count: feedbacks.length,
        linearRatingCount: linearRatingsStats.nonNullishCount,
        averageLinearRating: linearRatingsStats.nonNullishCount?linearRatingsStats.nonNullishAverage:undefined,
        bingo, maxBingo
    }
})
</script>

<style lang="scss" scoped>

.eventLogo {
  display: block;
  height: 54px;
  width: 124px;
  background-image: var(--voxxrin-event-logo-url);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  float: right;
}

.TalkFeedBacksContent {
  padding: var(--app-gutters);

  &-title {
    display: block;
    margin-bottom: 16px;
    font-weight: 900;
  }
}

.statGroup {
  display: flex;
  justify-content: space-between;
  column-gap: 16px;
}

.stat {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  row-gap: 8px;
  padding: 16px;
  background-color: var(--app-beige-medium);
  border-radius: 16px;
  overflow: hidden;

  @media (prefers-color-scheme: dark) {
    background-color: var(--app-medium-contrast);
    border: 1px solid var(--app-line-contrast);
  }

  img {
    position: absolute;
    left: 16px;
    bottom: -8px;
    height: 124px;
    transform: rotate(-16deg);
    opacity: 0.2;
  }

  &-label {
    font-size: 14px;
    text-align: center;
  }

  &-value {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    min-width: 34px;
    border-radius: 34px;
    color: var(--app-white);
    font-weight: 900;
    background-color: var(--voxxrin-event-theme-colors-primary-hex);

    @media (prefers-color-scheme: dark) {
      color: var(--app-primary);
    }
  }

  &-rate {
    font-weight: 900;
    font-size: 24px;

    &-value {
      color: var(--voxxrin-event-theme-colors-primary-hex);
    }
  }

  &-count {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 16px;
    background-color: var(--voxxrin-event-theme-colors-primary-hex);
    color: var(--app-white);

    @media (prefers-color-scheme: dark) {
      color: var(--app-primary);
    }

    &-label {
      font-weight: normal;
      opacity: 0.7;
    }
  }
}

.bingoContainer {
  margin-top: 16px;
  padding: 16px;
  border-radius: 16px;
  background-color: var(--app-beige-medium);

  @media (prefers-color-scheme: dark) {
    background-color: var(--app-medium-contrast);
    border: 1px solid var(--app-line-contrast);
  }
}

.privateBingo {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 16px;
  margin: 0;
  background: transparent;

  &-title {
    text-align: center;
    margin-top: 0;
  }

  &-count {
    display: flex;
    align-items: center;
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translate(-50%, 0);
    height: 20px;
    min-width: 24px;
    padding: 0 8px;
    border-radius: 0 0 12px 12px;
    color: var(--app-beige-line);
    font-weight: 900;
    font-size: 12px;
    border-left: 1px solid var(--app-beige-line);
    border-right: 1px solid var(--app-beige-line);
    border-bottom: 1px solid var(--app-beige-line);
    background-color: transparent;

    @media (prefers-color-scheme: dark) {
      color: var(--app-white);
      background: var(--app-grey-contrast);
    }
  }

  ion-item {
    --padding-start: 0;
    --inner-padding-end: 0;
    --border-radius: 12px;
    --border-width: 1px;
    --border-color: var(--app-beige-line);
    --background: var(--app-white);

    @media (prefers-color-scheme: dark) {
      --background: var(--app-light-contrast);
    }

    &:first-child, &:last-child {
      --border-radius: 12px;
    }

    &._hasFeedback {
      --background: var(--voxxrin-event-theme-colors-primary-hex);

      ion-label {
        color: white;
        font-weight: bold;
      }

      .privateBingo-count {
        background-color: var(--app-primary);
        color: var(--app-white);
        border: none;
      }
    }

    &:last-child {
      --border-width: 1px;
    }

    ion-label {
      margin: 0;
      padding: 20px 8px 16px 8px;
      font-size: 14px;
      white-space: normal;
      text-align: center;
    }
  }

  ion-progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    --progress-background: white;
    opacity: 0.15;
    z-index: -1;
  }
}

.feedback {
  margin: 16px 0;
  border-radius: 12px;
  box-shadow: none;
  border: 1px solid var(--app-beige-line);
  background: transparent;

  .feedback-content {
    display: flex;
    flex-direction: column;
    padding: 12px;

    &-info {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid var(--app-beige-line);

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }

      &:last-child {
        border-bottom: none;
      }

      label {
        flex: 1;
      }

      strong {
        flex: 1;
        text-align: left;
      }
    }
  }

  .feedback-head {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    row-gap: 4px;
    padding: 8px 12px 0 12px;
    background-color: var(--app-beige-line);


    @media (prefers-color-scheme: dark) {
      background-color: var(--app-light-contrast);
      color: var(--app-white);
    }

    ion-icon {
      font-size: 24px;
    }

    .feedback-id {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      label {
        flex: 1;
        font-size: 10px;
      }

      strong {
        flex: 1 1 auto;
        text-align: right;
        font-size: 10px;
      }
    }
  }
}
</style>
