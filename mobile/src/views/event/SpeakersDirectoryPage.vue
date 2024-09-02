<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header :conf-descriptor="confDescriptor" />
      <toolbar-header :title="LL.Speakers()" :modes="[...MODES]" :search-enabled="true"
                      @search-terms-updated="searchTerms => searchTermsRef = searchTerms"
                      @mode-updated="(updatedModeId, previousModeId) => console.log(`Mode updated from ${previousModeId} to ${updatedModeId}`)">
      </toolbar-header>

      <speaker-card @speaker-clicked="openSpeakerDetails($event)"></speaker-card>
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button class="btnGoToTicketing" :aria-label="LL.Go_To_Ticketing()">
          <ion-icon :icon="ticket" aria-hidden="true"></ion-icon>
        </ion-fab-button>
      </ion-fab>
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {useRoute} from "vue-router";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {managedRef as ref} from "@/views/vue-utils";
  import {IonFab, IonFabButton} from "@ionic/vue";
  import {albums, list, ticket} from "ionicons/icons";
  import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";
  import SpeakerCard from "@/components/speaker-card/SpeakerCard.vue";
  import {useTabbedPageNav} from "@/state/useTabbedPageNav";
  import {VoxxrinSimpleSpeaker} from "@/models/VoxxrinSpeaker";
  import ToolbarHeader from "@/components/ui/ToolbarHeader.vue";
  import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

  const { LL } = typesafeI18n()
  const route = useRoute();
  const spacedEventIdRef = useCurrentSpaceEventIdRef();
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);
  const { triggerTabbedPageNavigate } = useTabbedPageNav();

  const baseUrl = import.meta.env.BASE_URL;

  const MODES = [
    { id: "detailed", icon: albums, label: LL.value.Big_list_mode(), preSelected: true },
    { id: "compact", icon: list, label: LL.value.Compact_list_mode() },
  ] as const

  const searchTermsRef = ref<string|undefined>(undefined);
  // TODO: take searchTermsRef into consideration when looking for speakers/talks

  async function openSpeakerDetails(speaker: VoxxrinSimpleSpeaker) {
    if(speaker) {
      // TODO: Re-enable this once *tabbed* talk details as feedback viewer routing has been fixed
      // const talkFeedbackViewerToken = toValue(talkFeedbackViewerTokensRef)?.find(t => t.talkId.isSameThan(talk.id));
      // const url = talkFeedbackViewerToken
      //   ?`/events/${eventId.value.value}/talks/${talk.id.value}/asFeedbackViewer/${talkFeedbackViewerToken.secretToken}/details`
      //   :`/events/${eventId.value.value}/talks/${talk.id.value}/details`
      const url = `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/speakers/${speaker.id.value}/details`

      triggerTabbedPageNavigate(url, "forward", "push");
    }
  }

  function toggleSearchField() {
  }
</script>

<style lang="scss" scoped>
  .btnGoToTicketing {
    --background: var(--voxxrin-event-theme-colors-secondary-hex);
    --background-activated: var(--voxxrin-event-theme-colors-secondary-hex);
  }
</style>
