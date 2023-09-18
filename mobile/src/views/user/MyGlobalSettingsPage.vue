<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`, 0)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">App settings</ion-title>
        </ion-toolbar>
      </ion-header>

      <vox-bar-section>
        <template #title>Appearance</template>
      </vox-bar-section>
      <div class="sectionContainer">
        <ion-text color="primary" class="sectionContainer-title">
          <strong>Theme</strong>
        </ion-text>
        <ion-segment value="heart" class="classicSegmentButton">
          <ion-segment-button value="call" layout="icon-start">
            <ion-label>Light</ion-label>
            <ion-icon  src="/assets/icons/line/lightbulb-shine-line.svg"></ion-icon>
          </ion-segment-button>
          <ion-segment-button value="heart" layout="icon-start">
            <ion-label>Dark</ion-label>
            <ion-icon  src="/assets/icons/solid/moon.svg"></ion-icon>
          </ion-segment-button>
          <ion-segment-button value="pin" layout="icon-start">
            <ion-label>Auto</ion-label>
            <ion-icon  src="/assets/icons/solid/contrast.svg"></ion-icon>
          </ion-segment-button>
        </ion-segment>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {goBackOrNavigateTo} from "@/router";
import {useIonRouter} from "@ionic/vue";
import VoxBarSection from "@/components/ui/VoxBarSection.vue";

const ionRouter = useIonRouter();
</script>

<style lang="scss" scoped>

</style>
