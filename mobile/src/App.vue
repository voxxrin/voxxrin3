<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
  <pwa-reload-prompt />
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import PwaReloadPrompt from "@/components/PwaReloadPrompt.vue";
import {useDevUtilities} from "@/state/useDevUtilities";

useDevUtilities();
</script>
