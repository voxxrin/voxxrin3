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

      <schedule-talk v-for="(feedbackViewerTalk, index) in feedbackViewerTalksRef" :key="feedbackViewerTalk.detailedTalk.id.value"
          :conf-descriptor="feedbackViewerTalk.confDescriptor" :is-highlighted="() => false" :talk="feedbackViewerTalk.detailedTalk"
          @click="$router.push(`/user/events/${feedbackViewerTalk.token.eventId.value}/talks/${feedbackViewerTalk.token.talkId.value}/asFeedbackViewer/${feedbackViewerTalk.token.secretToken}`)">
        <template #upper-right="{ talk }">
          {{feedbackViewerTalk.confDescriptor.headingTitle}}
        </template>
        <template #footer-actions="{ talk, userTalkHook }">
        </template>
      </schedule-talk>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {goBackOrNavigateTo} from "@/router";
import {useIonRouter} from "@ionic/vue";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {ref, watch} from "vue";
import {VoxxrinUserTokensWallet} from "@/models/VoxxrinUser";
import {VoxxrinDetailedTalk} from "@/models/VoxxrinTalk";
import {fetchTalkDetails} from "@/services/DetailedTalks";
import {fetchConferenceDescriptor} from "@/services/ConferenceDescriptors";
import {EventId} from "@/models/VoxxrinEvent";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import {sortBy} from "@/models/utils";
import {typesafeI18n} from "@/i18n/i18n-vue";

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
</script>

<style lang="scss" scoped>
</style>
