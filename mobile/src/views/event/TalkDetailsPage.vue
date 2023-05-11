<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" back-btn-action="goBack" />
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title class="stickyHeader-title" slot="start" >Talk details</ion-title>
        </ion-toolbar>
      </ion-header>

      <p>
        Talk details here !
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";

const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
const event = useCurrentConferenceDescriptor(eventId);

</script>
