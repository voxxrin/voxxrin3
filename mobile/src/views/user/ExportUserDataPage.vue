<template>
  <!-- TODO #41 Connect elements -->
  <ion-page>
    <ion-header class="stickyHeader">
      <ion-toolbar>
        <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                    @click="triggerTabbedPageExitOrNavigate(`/user/dashboard`)">
          <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
        </ion-button>
        <ion-title class="stickyHeader-title" slot="start">{{ LL.Frequently_asked_questions() }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="exportContainer">
        <div class="shapeHead">
          <ion-img :src="'/assets/images/svg/export-device.svg'"></ion-img>
          <ion-text>Generate an export link to migrate your data to another device</ion-text>
        </div>

        <div class="exportContent">
          <span class="illu-export" v-if="true"></span>
          <div class="urlLink" v-if="false">
            <span class="qrcode">
              <ion-img :src="'assets/images/svg/qrcode-demo.svg'"></ion-img>
            </span>
            <span class="url">
              url.import.voxxrin.d4f4545454ez
            </span>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer class="exportActions">
      <ion-button size="small" fill="outline" shape="round" expand="block" v-if="false">
        Copy link <ion-icon :icon="copy" slot="end"></ion-icon>
      </ion-button>
      <ion-button size="small" fill="solid" shape="round" expand="block" v-if="true">
        Generate link for import <ion-icon :icon="download" slot="end"></ion-icon>
      </ion-button>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import {managedRef as ref} from "@/views/vue-utils";
import {copy, download} from "ionicons/icons";

const { LL } = typesafeI18n()

const step = ref(1)
setTimeout(() => { step.value = 2; }, 3000)
setTimeout(() => { step.value = 3; }, 6000)
setTimeout(() => { step.value = 4; }, 9000)

const {registerTabbedPageNavListeners, triggerTabbedPageExitOrNavigate} = useTabbedPageNav()
registerTabbedPageNavListeners();
</script>

<style lang="scss" scoped>
  .shapeHead {
    flex: 0 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    row-gap: 16px;
    padding: 24px 24px 16px 24px;
    background-color: var(--app-beige-medium);

    @media (prefers-color-scheme: dark) {
      background-color: var(--app-dark-contrast);
    }

    &:after {
      position: absolute;
      bottom: -28px;
      left: 50%;
      transform: translate(-50%, 0);
      width: 114%;
      height: 107px;
      border-radius: 200px / 35px;
      background-color: var(--app-beige-medium);
      content: "";
      z-index: -1;

      @media (prefers-color-scheme: dark) {
        background-color: var(--app-dark-contrast);
      }
    }

    ion-img {
      margin: 0 auto;
      width: 134px;
    }

    ion-text {
      font-size: 18px;
      font-weight: 800;
      text-align: center;
    }
  }

  .exportContainer {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .exportContent {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 24px;

    .illu-export {
      flex: 1;
      display: block;
      margin: 0 auto;
      width: 85vw;
      max-width: 670px;
      background-image: url('./assets/images/png/export-datas-illu.png');
      background-repeat: no-repeat;
      background-position: center;
      background-size: 100%;

      @media (prefers-color-scheme: dark) {
        background-image: url('./assets/images/png/export-datas-white-illu.png');
      }
    }
  }

  .urlLink {
    display: flex;
    flex-direction: column;
    align-items: center;

    .url {
      font-weight: 700;
      color: var(--app-primary);

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }
  }

  .qrcode {
    position: relative;
    display: block;
    height: 234px;
    width: 234px;
    margin: 16px 0;
    padding: 24px;
    background: var(--app-white);
    border-radius: 16px;
    animation: slide-in-elliptic-bottom-fwd 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
    z-index: 1;
  }

  .exportActions {
    padding: 24px;
    background: var(--app-background);
  }
</style>
