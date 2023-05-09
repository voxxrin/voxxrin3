
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" />

      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title class="stickyHeader-title" slot="start" >Feedbacks</ion-title>
          <ion-button slot="end" shape="round" size="small">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <p>
        Feedbacks planned here !
      </p>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
  import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue} from "@/views/vue-utils";
  import {useRoute} from "vue-router";

  const route = useRoute();
  const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
  const event = useCurrentConferenceDescriptor(eventId);
</script>
