<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="schedule" :href="`/events/${eventId.value}/schedule`">
          <ion-icon aria-hidden="true" src="/assets/icons/line/calendar-line.svg"/>
          <ion-label>Schedule</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="favorites" :href="`/events/${eventId.value}/favorites`">
          <ion-icon aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"/>
          <ion-label>Favorites</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="feedbacks" :href="`/events/${eventId.value}/feedbacks`">
          <ion-icon aria-hidden="true" src="/assets/icons/line/comments-2-line.svg"/>
          <ion-label>Feedbacks</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="infos" :href="`/events/${eventId.value}/infos`">
          <ion-icon aria-hidden="true" src="/assets/icons/line/info-circle-line.svg"/>
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

</script>
