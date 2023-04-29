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

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="chatbubble"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-fab-button id="testing-alert1">
            <ion-icon :icon="addCircle"></ion-icon>
          </ion-fab-button>
          <ion-label>test 1</ion-label>
          <ion-fab-button id="testing-alert2">
            <ion-icon :icon="addCircle"></ion-icon>
          </ion-fab-button>
          <ion-label>test 2</ion-label>
        </ion-fab-list>
        <ion-alert
            trigger="testing-alert1" header="Alert"
            subHeader="Testing message" message="This is alert 1 !"
        ></ion-alert>
        <ion-alert
            trigger="testing-alert2" header="Alert"
            subHeader="Testing message" message="This is alert 2 !"
        ></ion-alert>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonFabButton, IonFab, IonAlert, IonLabel, IonFabList } from '@ionic/vue';
import { chatbubble, addCircle } from 'ionicons/icons';
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";

const router = useRouter();
const route = useRoute();
const eventId = ref(route.params.eventId);
</script>

<style scoped>
</style>
