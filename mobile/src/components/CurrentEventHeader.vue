<template>
  <ion-header>
    <ion-toolbar>
      <ion-button @click="$router.go(-1)">Back</ion-button>
      <ion-title>{{ event?.headingName }}</ion-title>
      <current-event-status :event="event"></current-event-status>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {IonButton, IonHeader, IonTitle, IonToolbar} from "@ionic/vue";
import CurrentEventStatus from "@/components/CurrentEventStatus.vue";
import {PropType} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";

const props = defineProps({
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

</script>

<style scoped>
</style>
