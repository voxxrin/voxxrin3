<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`, 0)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">{{LL.My_talks_with_Feedbacks()}}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="schedule-talk-event"  v-for="(eventTalksGroup, index) in talksGroupedByEventRef" :key="eventTalksGroup.confDescriptor.id.value"
           v-themed-event-styles="eventTalksGroup.confDescriptor">
        <img :src="eventTalksGroup.confDescriptor?.backgroundUrl">
        <span class="schedule-talk-event-title">{{eventTalksGroup.confDescriptor.headingTitle}}</span>

        <schedule-talk v-for="(feedbackViewerTalk, index) in eventTalksGroup.talks" :key="feedbackViewerTalk.detailedTalk.id.value"
                :conf-descriptor="eventTalksGroup.confDescriptor" :is-highlighted="() => false" :talk="feedbackViewerTalk.detailedTalk"
                @click="$router.push(`/user/events/${feedbackViewerTalk.token.eventId.value}/talks/${feedbackViewerTalk.token.talkId.value}/asFeedbackViewer/${feedbackViewerTalk.token.secretToken}`)">
          <template #upper-right="{ talk }">
            {{eventTalksGroup.confDescriptor.headingTitle}}
          </template>
          <template #footer-actions="{ talk, userTalkHook }">
          </template>
        </schedule-talk>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {goBackOrNavigateTo} from "@/router";
import {useIonRouter} from "@ionic/vue";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {computed, ref, unref, watch} from "vue";
import {VoxxrinUserTokensWallet} from "@/models/VoxxrinUser";
import {VoxxrinDetailedTalk} from "@/models/VoxxrinTalk";
import {fetchTalkDetails} from "@/services/DetailedTalks";
import {fetchConferenceDescriptor} from "@/services/ConferenceDescriptors";
import {EventId} from "@/models/VoxxrinEvent";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import {sortBy} from "@/models/utils";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {match} from "ts-pattern";

const ionRouter = useIonRouter();

const {userTokensWalletRef} = useUserTokensWallet()
const { LL } = typesafeI18n()

type FeedbackViewerTalk = {
    token: VoxxrinUserTokensWallet['secretTokens']['talkFeedbacksViewerTokens'][number],
    confDescriptor: VoxxrinConferenceDescriptor,
    detailedTalk: VoxxrinDetailedTalk
}
const feedbackViewerTalksRef = ref<FeedbackViewerTalk[]>([]);
watch([userTokensWalletRef], async ([userTokensWallet]) => {
  if(!userTokensWallet || !userTokensWallet.secretTokens.talkFeedbacksViewerTokens.length) {
      feedbackViewerTalksRef.value = [];
      return;
  }

  const uniqueEventIds = new Set(userTokensWallet.secretTokens.talkFeedbacksViewerTokens.map(tfvt => tfvt.eventId.value))
  const confDescriptors = await Promise.all(Array.from(uniqueEventIds).map(async rawEventId => {
    return fetchConferenceDescriptor(new EventId(rawEventId));
  }));

  const confDescriptorsById = confDescriptors.reduce((confDescriptorsById, confDescriptor) => {
      if(confDescriptor) {
          confDescriptorsById.set(confDescriptor.id.value, confDescriptor);
      }
      return confDescriptorsById;
  }, new Map<string, VoxxrinConferenceDescriptor>())

  const talkWithFeedbacks = (await Promise.all(userTokensWallet.secretTokens.talkFeedbacksViewerTokens.map(async tfvt => {
      const confDescriptor = confDescriptorsById.get(tfvt.eventId.value);
      return {
          token: tfvt,
          confDescriptor,
          detailedTalk: confDescriptor ? await fetchTalkDetails(confDescriptor, tfvt.talkId) : undefined
      };
  }))).filter(v => !!v.detailedTalk && !!v.confDescriptor).map(feedbackViewerTalk => ({
      ...feedbackViewerTalk,
      detailedTalk: feedbackViewerTalk.detailedTalk!,
      confDescriptor: feedbackViewerTalk.confDescriptor!,
  }));

  feedbackViewerTalksRef.value = sortBy(talkWithFeedbacks, twf => -twf.confDescriptor.start.epochMilliseconds);
})

type EventTalksGroup = {
  confDescriptor: VoxxrinConferenceDescriptor,
  talks: FeedbackViewerTalk[]
}
const talksGroupedByEventRef = computed(() => {
  const feedbackViewerTalks = unref(feedbackViewerTalksRef);

  return feedbackViewerTalks.reduce((talkGroups, talk) => {
    const talkGroup = match(talkGroups.find(group => group.confDescriptor.id.isSameThan(talk.confDescriptor.id)))
        .with(undefined, () => {
          const talkGroup: EventTalksGroup = {
            confDescriptor: talk.confDescriptor,
            talks: []
          }
          talkGroups.push(talkGroup);
          return talkGroup;
        }).otherwise((existingTalkGroup) => existingTalkGroup)

    talkGroup.talks.push(talk);

    return talkGroups;
  }, [] as EventTalksGroup[])
})

</script>

<style lang="scss" scoped>

.schedule-talk-event {
  position: relative;
  background: linear-gradient(0deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4802) 0%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.98) 52.84%);
  margin: 16px;
  padding: 8px 4px;
  border-radius: 16px;

  img {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    height: 100%;
    width: 100%;
    z-index: -1;
    object-fit: cover;
    border-radius: 16px;
  }

  &-title {
    padding: 16px 12px;
    font-size: 18px;
    font-weight: bold;
    color: var(--app-white);
  }
}
</style>
