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
      <h1>All conferences</h1>
      <available-events-list :events="availableEvents" @event-clicked="(event) => showEventActions(event)">
        <template #no-event>
          No conference registered yet
        </template>
      </available-events-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
    useIonRouter
} from '@ionic/vue';
import {EventId, ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import {fetchConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {fetchAvailableEvents, watchCurrentAvailableEvents} from "@/state/CurrentAvailableEvents";
import {ref, Ref} from "vue";
import FavoritedEventSelector from "@/components/FavoritedEventSelector.vue";
import AvailableEventsList from "@/components/AvailableEventsList.vue";
import {presentActionSheetController} from "@/views/vue-utils";
import {Browser} from "@capacitor/browser";

const router = useIonRouter();

const favoritedEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
const availableEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
watchCurrentAvailableEvents(updatedAvailableEvents => {
    availableEvents.value = updatedAvailableEvents;
    favoritedEvents.value = updatedAvailableEvents;
})

fetchAvailableEvents();

async function selectEvent(eventId: EventId) {
    await fetchConferenceDescriptor(eventId);

    router.push(`/events/${eventId.value}`);
}

async function showEventActions(event: ListableVoxxrinEvent) {
    const result = await presentActionSheetController({
        header: 'Actions',
        buttons: [{
            text: 'Add to my favorites',
            data: {action: 'add-to-favs'},
        }, {
            text: 'Visit website',
            data: {action: 'visit-website'},
        }, {
            text: 'Cancel', role: 'cancel',
            data: {action: 'cancel'},
        }].filter(btn => !!event.websiteUrl || btn.data?.action !== 'visit-website')
    });

    // Not sure why, but ts-pattern's match() doesn't work here 🤔
    if(result?.action === 'visit-website') {
        Browser.open({url: event.websiteUrl})
    } else if(result?.action === 'add-to-favs') {
        console.log(`TODO: Add to favorites !`)
    } else if(result?.action === 'cancel') {

    } else {
        // popup closed
    }
}
</script>
