<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" />
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Favorites</ion-title>
        </ion-toolbar>
      </ion-header>

      Favorites here !
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
  import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
  import {useRoute} from "vue-router";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue} from "@/views/vue-utils";
  import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";

  const route = useRoute();
  const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
  const event = useCurrentConferenceDescriptor(eventId);
</script>
