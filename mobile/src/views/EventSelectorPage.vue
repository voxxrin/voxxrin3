<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Conference Selector</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card v-for="(availableEvent, index) in availableEvents" :key="index">
        <ion-card-title>{{availableEvent.title}}</ion-card-title>
        <ion-button @click="() => selectEvent(availableEvent.id)">
          Open
        </ion-button>
      </ion-card>
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
    IonCard,
    IonCardTitle,
    useIonRouter
} from '@ionic/vue';
import {EventId} from "@/models/VoxxrinEvent";
import {fetchConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {fetchAvailableEvents, watchCurrentAvailableEvents} from "@/state/CurrentAvailableEvents";
import {ListableEvent} from "../../../shared/event-list.firestore";
import {ref, Ref} from "vue";

const router = useIonRouter();

const availableEvents: Ref<ListableEvent[]> = ref([]);
watchCurrentAvailableEvents(updatedAvailableEvents => {
    availableEvents.value = updatedAvailableEvents;
})

fetchAvailableEvents();

async function selectEvent(eventCode: string) {
    await fetchConferenceDescriptor(new EventId(eventCode));

    router.push(`/events/${eventCode}`);
}
</script>
