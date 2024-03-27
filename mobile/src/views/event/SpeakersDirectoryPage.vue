<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header :conf-descriptor="confDescriptor" />
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start">{{ LL.Speakers() }}</ion-title>
          <div class="toolbarHeader-options" slot="end">
            <ion-segment value="buttons" class="listModesSwitch">
              <ion-segment-button class="listModesSwitch-button" value="default" :aria-label="LL.Big_list_mode()">
                <ion-icon :icon="albums" aria-hidden="true"></ion-icon>
              </ion-segment-button>
              <ion-segment-button class="listModesSwitch-button" value="segment" :aria-label="LL.Compact_list_mode()">
                <ion-icon :icon="list" aria-hidden="true"></ion-icon>
              </ion-segment-button>
            </ion-segment>
            <ion-button slot="end" shape="round" size="small" @click="toggleSearchField()"
                        :aria-label="LL.Search()">
              <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-header>

      <SpeakerCard></SpeakerCard>
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
  import {albums, list} from "ionicons/icons";
  import {IonSegmentButton, IonSegment} from "@ionic/vue";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
  const baseUrl = import.meta.env.BASE_URL;
</script>

<style lang="scss" scoped>
  .toolbarHeader {
    &-options {
      display: flex;
      align-items: center;
      gap: var(--app-gutters);
    }
  }
</style>
