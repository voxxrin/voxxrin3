<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`)"
                      :aria-label="LL.Previous_screen()">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">{{LL.My_talks_with_Feedbacks()}}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="schedule-talk-event"  v-for="(eventTalksGroup, index) in talksGroupedByEventRef" :key="eventTalksGroup.confDescriptor.id.value"
           v-themed-event-styles="eventTalksGroup.confDescriptor"
           :style="{ 'background': eventTalksGroup.confDescriptor.headingBackground || `var(--default-background)` }"
      >
        <event-talks-group :conf-descriptor="eventTalksGroup.confDescriptor" :talks="eventTalksGroup.talks"
          @talk-clicked="openTalkDetails($event)"/>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {goBackOrNavigateTo} from "@/router";
import {useIonRouter} from "@ionic/vue";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {computed, Ref, toValue, unref, watch} from "vue";
import {managedRef as ref} from "@/views/vue-utils";
import {VoxxrinUserTokensWallet} from "@/models/VoxxrinUser";
import {VoxxrinDetailedTalk, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {fetchTalkDetails} from "@/services/DetailedTalks";
import {fetchConferenceDescriptor} from "@/services/ConferenceDescriptors";
import {toSpacedEventId} from "@/models/VoxxrinEvent";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {sortBy} from "@/models/utils";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {match, P} from "ts-pattern";
import EventTalksGroup from "@/components/events/EventTalksGroup.vue";
import {getResolvedEventRootPath} from "@/services/Spaces";
import {dedupe} from "@/services/Arrays";

const ionRouter = useIonRouter();

const {userTokensWalletRef} = useUserTokensWallet()
const { LL } = typesafeI18n()

type FeedbackViewerTalk = {
    token: VoxxrinUserTokensWallet['secretTokens']['talkFeedbacksViewerTokens'][number],
    confDescriptor: VoxxrinConferenceDescriptor,
    detailedTalk: VoxxrinDetailedTalk
}
const feedbackViewerTalksRef = ref<FeedbackViewerTalk[]>([]) as Ref<FeedbackViewerTalk[]>;
watch([userTokensWalletRef], async ([userTokensWallet]) => {
  if(!userTokensWallet || !userTokensWallet.secretTokens.talkFeedbacksViewerTokens.length) {
      feedbackViewerTalksRef.value = [];
      return;
  }

  const confDescriptors = await Promise.all(dedupe(
    userTokensWallet.secretTokens.talkFeedbacksViewerTokens,
    tfvt => `${tfvt.eventId.value}__${tfvt.spaceToken?.value}`
  ).map(tfvt => {
    return fetchConferenceDescriptor(toSpacedEventId(tfvt.eventId, tfvt.spaceToken))
  }))

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
}, {immediate: true})

type EventTalksGroup = {
  confDescriptor: VoxxrinConferenceDescriptor,
  talks: VoxxrinDetailedTalk[]
}
const talksGroupedByEventRef = computed(() => {
  const feedbackViewerTalks = unref(feedbackViewerTalksRef);

  return feedbackViewerTalks.reduce((talkGroups, talk) => {
    const talkGroup = match(talkGroups.find(group => group.confDescriptor.id.isSameThan(talk.confDescriptor.id)))
        .with(P.nullish, () => {
          const talkGroup: EventTalksGroup = {
            confDescriptor: talk.confDescriptor,
            talks: []
          }
          talkGroups.push(talkGroup);
          return talkGroup;
        }).otherwise((existingTalkGroup) => existingTalkGroup)

    talkGroup.talks.push(talk.detailedTalk);

    return talkGroups;
  }, [] as EventTalksGroup[])
})

function openTalkDetails(talk: VoxxrinTalk) {
    const feedbackViewerTalks = toValue(feedbackViewerTalksRef)

    const feedbackViewerTalk = feedbackViewerTalks.find(feedbackViewerTalk => feedbackViewerTalk.detailedTalk.id.isSameThan(talk.id));
    if(feedbackViewerTalk) {
        ionRouter.push(`/user${getResolvedEventRootPath(feedbackViewerTalk.token.eventId, feedbackViewerTalk.token.spaceToken)}/talks/${feedbackViewerTalk.token.talkId.value}/asFeedbackViewer/${feedbackViewerTalk.token.secretToken}`)
    }
}

</script>

<style lang="scss" scoped>

.schedule-talk-event {
  position: relative;
  --default-background: linear-gradient(0deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4802) 0%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.98) 52.84%);
  margin: 16px;
  padding: 8px 4px;
  border-radius: 16px;
}
</style>
