<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header :conf-descriptor="confDescriptor" />
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start">{{ LL.Speakers() }}</ion-title>
          <div slot="end" class="listModesSwitch">
            <ion-button class="listModesSwitch-button _active">
              <ion-icon :icon="albums"></ion-icon>
            </ion-button>
            <ion-button class="listModesSwitch-button">
              <ion-icon :icon="list"></ion-icon>
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-header>

      <SpeakerCard></SpeakerCard>
      <SpeakerCompactCard></SpeakerCompactCard>
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {useRoute} from "vue-router";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {managedRef as ref} from "@/views/vue-utils";
  import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";
  import SpeakerCard from "@/components/speaker-card/SpeakerCard.vue";
  import SpeakerCompactCard from "@/components/speaker-card/SpeakerCompactCard.vue";
  import {albums, list} from "ionicons/icons";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
  const baseUrl = import.meta.env.BASE_URL;
</script>
