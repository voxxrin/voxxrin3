<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" />

      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title slot="start" >Infos</ion-title>
          <ion-button slot="end" shape="round" size="small">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <p>
        🚧 {{ LL.Info_page_still_under_construction() }}
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
  import {useRoute} from "vue-router";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {computed, ref} from "vue";
  import {typesafeI18n} from "@/i18n/i18n-vue";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
</script>
