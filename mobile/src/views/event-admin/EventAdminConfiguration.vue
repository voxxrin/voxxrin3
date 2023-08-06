<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="triggerTabbedPageExitOrNavigate(`/event-selector`)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">Event Configuration</ion-title>
        </ion-toolbar>
      </ion-header>

      TODO: Event configuration here... allowing to :
      <ul>
        <li>Trigger a manual crawling for the event</li>
        <li>Update some features : room visibility, favorites/watch/feedbacks enabled</li>
        <li>Update themes and see directly how this works</li>
      </ul>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter} from "@ionic/vue";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";

const {triggerTabbedPageExitOrNavigate} = useTabbedPageNav();

const ionRouter = useIonRouter();
</script>

<style lang="scss" scoped>
</style>
