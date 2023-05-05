<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="schedule" @click="selectedTab = 'schedule'" :href="`/events/${eventId.value}/schedule`">
          <ion-icon aria-hidden="true" :src="selectedTab === 'schedule' ? scheduleSelectedIcon : scheduleIcon"/>
          <ion-label>Schedule</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="favorites" @click="selectedTab = 'favorites'" :href="`/events/${eventId.value}/favorites`">
          <ion-icon aria-hidden="true" :src="selectedTab === 'favorites' ? favoritesSelectedIcon : favoritesIcon"/>
          <ion-label>Favorites</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="feedbacks" @click="selectedTab = 'feedbacks'" :href="`/events/${eventId.value}/feedbacks`">
          <ion-icon aria-hidden="true" :src="selectedTab === 'feedbacks' ? feedbacksSelectedIcon : feedbacksIcon"/>
          <ion-label>Feedbacks</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="infos" @click="selectedTab = 'infos'" :href="`/events/${eventId.value}/infos`">
          <ion-icon aria-hidden="true" :src="selectedTab === 'infos' ? infosSelectedIcon : infosIcon"/>
          <ion-label>Infos</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonLabel,
    IonIcon,
    IonPage,
    IonRouterOutlet,
} from '@ionic/vue';
import {ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
import {getRouteParamsValue} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";

const router = useRouter();
const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')!));
const event = useCurrentConferenceDescriptor(eventId.value);


const selectedTab = ref('schedule'); // Définit le tab initial sélectionné

// Chemins des images pour chaque icône
const scheduleIcon = '/assets/icons/line/calendar-line.svg';
const scheduleSelectedIcon = '/assets/icons/solid/calendar.svg';
const favoritesIcon = '/assets/icons/line/bookmark-line-favorite.svg';
const favoritesSelectedIcon = '/assets/icons/solid/bookmark-favorite.svg';
const feedbacksIcon = '/assets/icons/line/comments-2-line.svg';
const feedbacksSelectedIcon = '/assets/icons/solid/comments-2.svg';
const infosIcon = '/assets/icons/line/info-circle-line.svg';
const infosSelectedIcon = '/assets/icons/solid/info-circle.svg';
</script>
