<template>
  <ion-page>
    <ion-content>
      TO BE IMPLEMENTED: My personal data
      <ion-button @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`, 0)">Back</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {goBackOrNavigateTo} from "@/router";
import {useIonRouter} from "@ionic/vue";

const ionRouter = useIonRouter();
</script>

<style lang="scss" scoped>
</style>
