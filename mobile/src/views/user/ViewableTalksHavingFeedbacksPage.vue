<template>
  <ion-page>
    <ion-content>
      TO BE IMPLEMENTED: talks with feedbacks I have access to
      <ion-button @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`, 0)">Back</ion-button>
      <ion-button @click="$router.push(`/user/talks/1/feedbacks`)">Feedbacks for talk 1</ion-button>
      <ion-button @click="$router.push(`/user/talks/2/feedbacks`)">Feedbacks for talk 2</ion-button>
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
