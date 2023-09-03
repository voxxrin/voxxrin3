<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`, 0)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">My talks with feedbacks</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-button @click="$router.push(`/user/events/dvbe23/talks/1/asFeedbackViewer/12345`)">Feedbacks for talk 1</ion-button>
      <ion-button @click="$router.push(`/user/events/jsc23/talks/2/asFeedbackViewer/67890`)">Feedbacks for talk 2</ion-button>
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
