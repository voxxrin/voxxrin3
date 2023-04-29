<template>
  <ion-header>
    <ion-toolbar>
      <ion-button @click="$router.go(-1)">Back</ion-button>
      <ion-title>Conference {{ eventId }}</ion-title>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {IonButton, IonHeader, IonTitle, IonToolbar} from "@ionic/vue";
import {useRoute} from "vue-router";
import {ref} from "vue";

const route = useRoute();
const eventId = ref(route.params.eventId);

</script>

<style scoped>
</style>
