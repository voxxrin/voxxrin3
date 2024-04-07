<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`)"
                      :aria-label="LL.Previous_screen()">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">My personal data</ion-title>
        </ion-toolbar>
      </ion-header>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {goBackOrNavigateTo} from "@/router";
import {useIonRouter} from "@ionic/vue";
import {typesafeI18n} from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()

const ionRouter = useIonRouter();
</script>

<style lang="scss" scoped>
</style>
