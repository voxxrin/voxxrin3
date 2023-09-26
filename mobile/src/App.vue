<template>
  <ion-app :style="animationVariables">
    <ion-router-outlet />
  </ion-app>
  <pwa-reload-prompt />
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import PwaReloadPrompt from "@/components/PwaReloadPrompt.vue";
import {useDevUtilities} from "@/state/useDevUtilities";
import {TimeslotAnimations} from "@/services/Animations";

const animationVariables = {
  '--app-voxxrin-animations-timeslots-anim-base-delay': `${TimeslotAnimations.ANIMATION_BASE_DELAY.total('milliseconds')}ms`,
  '--app-voxxrin-animations-timeslots-anim-duration': `${TimeslotAnimations.ANIMATION_DURATION.total('milliseconds')}ms`,
}

useDevUtilities();
</script>
