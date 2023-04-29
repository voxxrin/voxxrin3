<template>
  <ion-page>
    <ion-tabs>
      <current-event-header />
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="schedule" @click="router.push({name: 'eventSchedule', params: {eventId}})">
          <ion-icon aria-hidden="true" :icon="calendar" />
          <ion-label>Schedule</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="favorites" @click="router.push({name: 'eventFavorites', params: {eventId}})">
          <ion-icon aria-hidden="true" :icon="star" />
          <ion-label>Favorites</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="feedbacks" @click="router.push({name: 'eventFeedbacks', params: {eventId}})">
          <ion-icon aria-hidden="true" :icon="chatbox" />
          <ion-label>Feedbacks</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="infos" @click="router.push({name: 'eventInformations', params: {eventId}})">
          <ion-icon aria-hidden="true" :icon="information" />
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
import {calendar, chatbox, information, star} from 'ionicons/icons';
import {ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import CurrentEventHeader from "@/components/CurrentEventHeader.vue";

const router = useRouter();
const route = useRoute();
const eventId = ref(route.params.eventId);

</script>
