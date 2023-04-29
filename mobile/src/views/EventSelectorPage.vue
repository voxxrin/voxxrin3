<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Conference Selector</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-button router-direction="forward" @click="router.push({name: 'rootEventPage', params: {eventId: 'dvbe23'}})">
        Devoxx BE 2023 Schedule
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import {useRouter} from "vue-router";

const router = useRouter();
</script>
