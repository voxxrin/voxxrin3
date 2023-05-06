<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Conference Selector</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-button @click="() => selectEvent('dvbe22')">
        Devoxx BE 2022 Schedule
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    useIonRouter
} from '@ionic/vue';
import {EventId} from "@/models/VoxxrinEvent";
import {fetchConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";

const router = useIonRouter();
async function selectEvent(eventCode: string) {
    await fetchConferenceDescriptor(new EventId(eventCode));

    router.push(`/events/${eventCode}`);
}
</script>
