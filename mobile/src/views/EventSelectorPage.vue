<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Conference Selector</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <h1>Favorited conferences</h1>
      <favorited-event-selector
          :favoritedEvents="favoritedEvents" @event-selected="(event) => selectEvent(event.id)">
        <template #no-favorites>
          No favorites available yet...
        </template>
      </favorited-event-selector>
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
    useIonRouter
} from '@ionic/vue';
import {EventId, ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import {fetchConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {fetchAvailableEvents, watchCurrentAvailableEvents} from "@/state/CurrentAvailableEvents";
import {ref, Ref} from "vue";
import FavoritedEventSelector from "@/components/FavoritedEventSelector.vue";

const router = useIonRouter();

const favoritedEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
watchCurrentAvailableEvents(updatedAvailableEvents => {
    favoritedEvents.value = updatedAvailableEvents;
})

fetchAvailableEvents();

async function selectEvent(eventId: EventId) {
    await fetchConferenceDescriptor(eventId);

    router.push(`/events/${eventId.value}`);
}
</script>
