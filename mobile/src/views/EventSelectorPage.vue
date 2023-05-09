<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Conference Selector</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-input label="Search a conference" label-placement="stacked" fill="outline"
                 :debounce="300" placeholder="Keywords..."
                 @ionInput="(ev) => searchTextUpdated(ev.target.value)"
      ></ion-input>
      <ion-toggle :enable-on-off-labels="true" @ionChange="(ev) => includePastEventUpdated(ev.target.checked)">Past events</ion-toggle>

      <h1>Favorited conferences</h1>
      <favorited-event-selector
          :favoritedEvents="filteredFavoritedEvents" @event-selected="(event) => selectEvent(event.id)">
        <template #no-favorites>
          No favorites available yet...
        </template>
      </favorited-event-selector>
      <h1>All conferences</h1>
      <available-events-list :events="filteredAvailableEvents" @event-clicked="(event) => showEventActions(event)">
        <template #no-event>
          No conference registered yet
        </template>
      </available-events-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonToggle,
    IonInput,
    useIonRouter
} from '@ionic/vue';
import {EventId, ListableVoxxrinEvent, searchEvents} from "@/models/VoxxrinEvent";
import {fetchConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {fetchAvailableEvents, watchCurrentAvailableEvents} from "@/state/CurrentAvailableEvents";
import {ref, Ref, watch} from "vue";
import FavoritedEventSelector from "@/components/FavoritedEventSelector.vue";
import AvailableEventsList from "@/components/AvailableEventsList.vue";
import {presentActionSheetController} from "@/views/vue-utils";
import {Browser} from "@capacitor/browser";

const router = useIonRouter();

const availableEventsRef: Ref<ListableVoxxrinEvent[]> = ref([]);
watchCurrentAvailableEvents(updatedAvailableEvents => {
    availableEventsRef.value = updatedAvailableEvents;
})
fetchAvailableEvents();

const favoritedTalksRef = ref<EventId[]>([]);

const searchCriteriaRef = ref<{ terms: string|undefined, includePastEvents: boolean}>({ terms: undefined, includePastEvents: false });

const filteredFavoritedEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
const filteredAvailableEvents: Ref<ListableVoxxrinEvent[]> = ref([]);
watch([availableEventsRef, searchCriteriaRef, favoritedTalksRef], ([availableEvents, searchCriteria, favoritedTalks]) => {
    const {events, favorites} = searchEvents(availableEvents, searchCriteria, favoritedTalks)
    filteredAvailableEvents.value = events;
    filteredFavoritedEvents.value = favorites;
}, {immediate: true})

async function selectEvent(eventId: EventId) {
    await fetchConferenceDescriptor(eventId);

    router.push(`/events/${eventId.value}`);
}

function searchTextUpdated(searchText: string) {
    searchCriteriaRef.value = {...searchCriteriaRef.value, terms: searchText}
}

function includePastEventUpdated(includePastEvents: boolean) {
    searchCriteriaRef.value = {...searchCriteriaRef.value, includePastEvents }
}

async function showEventActions(event: ListableVoxxrinEvent) {
    const result = await presentActionSheetController({
        header: 'Actions',
        buttons: [favoritedTalksRef.value.includes(event.id)?{
            text: 'Remove from favorites',
            data: {action: 'remove-from-favs'},
        }:{
            text: 'Add to my favorites',
            data: {action: 'add-to-favs'},
        }].concat(event.websiteUrl?[{
            text: 'Visit website',
            data: {action: 'visit-website'},
        }]:[]).concat([{
            text: 'Cancel', role: 'cancel',
            data: {action: 'cancel'},
        }])
    });

    // Not sure why, but ts-pattern's match() doesn't work here 🤔
    if(result?.action === 'visit-website') {
        Browser.open({url: event.websiteUrl})
    } else if(result?.action === 'add-to-favs') {
        favoritedTalksRef.value = [...favoritedTalksRef.value, event.id];
    } else if(result?.action === 'remove-from-favs') {
        favoritedTalksRef.value = favoritedTalksRef.value.filter(ev => !ev.isSameThan(event.id));
    } else if(result?.action === 'cancel') {

    } else {
        // popup closed
    }
}
</script>
