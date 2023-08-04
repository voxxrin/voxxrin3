<template>
  <ion-page>
    <ion-content class="userDashboard">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="triggerTabbedPageExitOrNavigate(`/event-selector`)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">Profil</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="userDashboard-content">
        <div class="listCardButton">
          <ion-button class="listCardButton-item" @click="$router.push(`/user/talks`)">
            <div class="listCardButton-item-icon">
              <ion-icon src="/assets/icons/solid/comments-2.svg"></ion-icon>
            </div>
            <div class="listCardButton-item-text">
              <span class="titleItem">My talks with Feedbacks</span>
            </div>
            <ion-icon class="listCardButton-item-nav" src="/assets/icons/line/chevron-right-line.svg"></ion-icon>
          </ion-button>
          <ion-button class="listCardButton-item" @click="$router.push(`/user/my-global-settings`)">
            <div class="listCardButton-item-icon">
              <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>
            </div>
            <div class="listCardButton-item-text">
              <span class="titleItem">App settings</span>
              <small class="subTitleItem">Configure my preferences app</small>
            </div>
            <ion-icon class="listCardButton-item-nav" src="/assets/icons/line/chevron-right-line.svg"></ion-icon>
          </ion-button>
          <ion-button class="listCardButton-item" @click="$router.push(`/user/my-personal-data`)">
            <div class="listCardButton-item-icon">
              <ion-icon src="/assets/icons/solid/data.svg"></ion-icon>
            </div>
            <div class="listCardButton-item-text">
              <span class="titleItem">My personal data</span>
              <small class="subTitleItem">Import, Export or delete my data</small>
            </div>
            <ion-icon class="listCardButton-item-nav" src="/assets/icons/line/chevron-right-line.svg"></ion-icon>
          </ion-button>
        </div>
      </div>
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
  .userDashboard {
    &-content {
      padding: var(--app-gutters);
    }
  }
</style>
