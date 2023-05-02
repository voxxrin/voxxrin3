<template>
  <ion-card>
    <ion-icon :icon="icons[talkBreak.icon]"></ion-icon>
    <ion-label>{{talkBreak.title}}</ion-label>
    <ion-badge>room:{{talkBreak.room.title}}</ion-badge>
  </ion-card>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
    IonCard,
    IonLabel,
    IonIcon,
    IonBadge,
} from '@ionic/vue';
import {VoxxrinBreak} from "@/models/VoxxrinTalk";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import * as icons from "ionicons/icons";

const props = defineProps({
    talkBreak: {
        required: true,
        type: Object as PropType<VoxxrinBreak>
    },
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

</script>

<style scoped>

</style>
