<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Schedule</ion-title>
        </ion-toolbar>
      </ion-header>

      Schedule here !

      <ion-button router-direction="forward" @click="router.push({name: 'eventTalkDetails', params: {eventId, talkId: '1'}})">
        Open talk 1
      </ion-button>
      <ion-button router-direction="forward" @click="router.push({name: 'eventTalkDetails', params: {eventId, talkId: '2'}})">
        Open talk 2
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";

const router = useRouter();
const route = useRoute();
const eventId = ref(route.params.eventId);
</script>
