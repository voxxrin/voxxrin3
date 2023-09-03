<template>
  <ion-page>
    <ion-content v-if="confDescriptorRef && talkFeedbacksStats && detailedTalk">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/talks`, 0)">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">Talk feedbacks</ion-title>
        </ion-toolbar>
      </ion-header>

      <talk-details-header :conf-descriptor="confDescriptorRef" :talk="detailedTalk"></talk-details-header>

      <h2>Stats</h2>
      Number of feedbacks: {{talkFeedbacksStats.count}}<br/>
      <div v-if="talkFeedbacksStats.count>0">
        <div v-if="confDescriptorRef.features.ratings.scale.enabled">
          Average linear ratings: {{talkFeedbacksStats.averageLinearRating}} / {{confDescriptorRef.features.ratings.scale.labels.length}}
          (votes: {{talkFeedbacksStats.linearRatingCount}})
        </div>
        <div v-if="confDescriptorRef.features.ratings.bingo.enabled && !confDescriptorRef.features.ratings.bingo.isPublic">
          <h3>Private Bingo</h3>
          <ion-list :inset="true">
            <ion-item v-for="(bingoStat, choiceIndex) in talkFeedbacksStats.bingo" :key="choiceIndex">
              <ion-label>
                {{bingoStat.choiceLabel}} ({{bingoStat.count}})
                <ion-progress-bar :value="bingoStat.count / talkFeedbacksStats.maxBingo" />
              </ion-label>
            </ion-item>
          </ion-list>
        </div>
      </div>
      <hr/>
      <h2>Detailed Feedbacks</h2>
      <ion-card class="feedback" v-for="(talkFeedback, index) in displayableTalkFeedbacks" :key="talkFeedback.attendeePublicToken">
        <div>Last updated: {{talkFeedback.lastUpdatedOn}}</div>
        <div>Who: {{talkFeedback.attendeePublicToken}}</div>
        <div v-if="confDescriptorRef.features.ratings.scale.enabled">Linear rating: {{talkFeedback.ratings['linear-rating']}}</div>
        <div v-if="confDescriptorRef.features.ratings.bingo.enabled">Bingo: {{talkFeedback.ratings['bingo'].join(", ")}}</div>
        <div v-if="confDescriptorRef.features.ratings['custom-scale'].enabled">Custom rating: {{talkFeedback.ratings['custom-rating']}}</div>
        <div v-if="false">Comment: {{talkFeedback.comment}}</div>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {goBackOrNavigateTo} from "@/router";
import {useIonRouter, IonProgressBar} from "@ionic/vue";
import {useTalkFeedbacks} from "@/state/useTalkFeedbacks";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {
    useConferenceDescriptor,
} from "@/state/useConferenceDescriptor";
import {computed, ref, unref} from "vue";
import {numberArrayStats, sortBy} from "@/models/utils";
import TalkDetailsHeader from "@/components/talk-details/TalkDetailsHeader.vue";
import {useSharedEventTalk} from "@/state/useEventTalk";

const ionRouter = useIonRouter();
const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = ref(new TalkId(getRouteParamsValue(route, 'talkId')));
const secretFeedbacksViewerToken = ref(getRouteParamsValue(route, 'secretFeedbacksViewerToken'));

const {conferenceDescriptor: confDescriptorRef} = useConferenceDescriptor(eventId);
const { talkDetails: detailedTalk } = useSharedEventTalk(confDescriptorRef, talkId);

const {talkFeedbacksRef} = useTalkFeedbacks(eventId, talkId, secretFeedbacksViewerToken);
const displayableTalkFeedbacks = computed(() => {
    const talkFeedbacks = unref(talkFeedbacksRef);
    const confDescriptor = unref(confDescriptorRef);

    if(!confDescriptor) {
        return [];
    }

    const choiceLabelsById = (confDescriptor.features.ratings.bingo.choices || []).reduce((choiceLabelsById, choice) => {
        choiceLabelsById.set(choice.id, choice.label);
        return choiceLabelsById;
    }, new Map<string,string>())

    return sortBy(talkFeedbacks.map(tf => ({
        ...tf,
        ratings: {
            ...tf.ratings,
            bingo: tf.ratings.bingo.map(choiceId => choiceLabelsById.get(choiceId))
        }
    })), tf => -Date.parse(tf.lastUpdatedOn))
})

const talkFeedbacksStats = computed(() => {
    const feedbacks = unref(talkFeedbacksRef);
    const confDescriptor = unref(confDescriptorRef);

    if(!confDescriptor) {
        return undefined;
    }

    const linearRatingsStats = numberArrayStats(feedbacks.map(f => f.ratings["linear-rating"]))

    const bingo = sortBy(confDescriptor.features.ratings.bingo.choices.reduce((bingo, choice) => {
        bingo.push({
            choiceId: choice.id,
            choiceLabel: choice.label,
            count: feedbacks.filter(f => (f.ratings.bingo || []).includes(choice.id)).length
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
</style>
