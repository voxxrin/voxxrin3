<template>
  <ion-page>
    <ion-content>
        TO BE IMPLEMENTED WITH STATS AND NICE UI
      <br/>
      <ion-button @click="triggerTabbedPageExitOrNavigate(`/event-selector`)">Close</ion-button>
      <ion-button @click="$router.push(`/user/talks`)">My talks with Feedbacks</ion-button>
      <ion-button @click="$router.push(`/user/my-global-settings`)">App settings</ion-button>
      <ion-button @click="$router.push(`/user/my-personal-data`)">My personal data</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter} from "@ionic/vue";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";

const ionRouter = useIonRouter();

const {registerTabbedPageNavListeners, triggerTabbedPageExitOrNavigate} = useTabbedPageNav()

registerTabbedPageNavListeners();
</script>

<style lang="scss" scoped>
</style>
