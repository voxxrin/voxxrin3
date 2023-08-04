<template>
  <ion-page>
    <ion-content>
      TO BE IMPLEMENTED: Talk feedbacks
      <ion-button @click="goBackOrNavigateTo(ionRouter, `/user/talks`, 0)">Back</ion-button>
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
