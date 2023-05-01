<template>
  <ion-header>
    <ion-toolbar>
      <ion-button @click="$router.go(-1)">Back</ion-button>
      <ion-title>{{ currentConferenceDescriptor?.headingName }}</ion-title>
      <current-event-status></current-event-status>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {IonButton, IonHeader, IonTitle, IonToolbar} from "@ionic/vue";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import CurrentEventStatus from "@/components/CurrentEventStatus.vue";

const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);

const currentConferenceDescriptor = useCurrentConferenceDescriptor(eventId);
</script>

<style scoped>
</style>
