<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/event-selector`, 0)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">Event Talk Feedbacks</ion-title>
        </ion-toolbar>
      </ion-header>
      TODO: Event Notifications here...
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter} from "@ionic/vue";
import {goBackOrNavigateTo} from "@/router";

const ionRouter = useIonRouter();
</script>

<style lang="scss" scoped>
</style>
