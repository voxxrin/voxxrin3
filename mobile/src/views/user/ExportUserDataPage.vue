<template>
  <!-- TODO #41 Connect elements -->
  <ion-page>
    <ion-header class="stickyHeader">
      <ion-toolbar>
        <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                    @click="triggerTabbedPageExitOrNavigate(`/user/dashboard`)">
          <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
        </ion-button>
        <ion-title class="stickyHeader-title" slot="start">Export Datas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="exportContainer">
        <div class="shapeHead">
          <ion-img :src="'/assets/images/svg/export-device.svg'"></ion-img>
          <ion-text>Generate an export link to migrate your data to another device</ion-text>
        </div>

        <div class="exportContent">
          <!-- Step 1 -->
          <span class="illu-export" v-if="true"></span>

          <!-- Step 2 -->
          <div class="urlLink" v-if="false">
            <span class="qrcode">
              <ion-img :src="'assets/images/svg/qrcode-demo.svg'"></ion-img>
            </span>
            <span class="url">
              url.import.voxxrin.d4f4545454ez
            </span>
          </div>

          <!-- Step 3 -->
          <div class="importProgress" v-if="false">
            <div class="importProgress-blur">
              <div class="circle">
                <div class="circle circle-lg">
                  <div class="circle circle-md">
                    <div class="circle circle-sm"></div>
                  </div>
                </div>
              </div>
            </div>
            <ion-spinner name="dots"></ion-spinner>
            <ion-text>Data transfer in progress...</ion-text>
            <div class="datasLabelsAnimation">
              <div class="datasLabelsAnimation-label _first"><div>My kick-ass program</div></div>
              <div class="datasLabelsAnimation-label _second"><div> My best feedback</div></div>
              <div class="datasLabelsAnimation-label _third"><div>My params</div></div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer class="exportActions">
      <!-- Step 1 -->
      <ion-button  fill="solid" shape="round" expand="block" v-if="true">
        Generate link for import <ion-icon :icon="download" slot="end"></ion-icon>
      </ion-button>
      <!-- Step 2 -->
      <ion-button fill="outline" shape="round" expand="block" v-if="false">
        Copy link <ion-icon :icon="copy" slot="end"></ion-icon>
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

  .importProgress {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &:after {
      position: absolute;
      height: 400px;
      width: 400px;
      border-radius: 500px;
      backdrop-filter: blur(30px) saturate(120%);
      background: rgba(white, 0.5);
      animation: scaleUpDown 4s ease-in-out alternate-reverse infinite;
      content: '';
      z-index: -2;

      @media (prefers-color-scheme: dark) {
        background: rgba(#242935, 0.5);
      }
    }

    @keyframes scaleUpDown {
      from {transform: scale(1); opacity: 1;}
      50% {transform: scale(1.2); opacity: 0.5;}
      to {transform: scale(1); opacity: 1;}
    }

    &-blur {
      position: absolute;
      --size: 400px;
      --speed: 4s;
      --easing: cubic-bezier(0.8, 0.2, 0.2, 0.8);
      width: var(--size);
      height: var(--size);
      filter: blur(calc(var(--size) / 10));
      border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
      z-index: -3;
      overflow: hidden;

      .circle {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          width: 44px;
          height: 44px;
          top: -6px;
          border-radius: 50%;
          background: var(--app-voxxrin);
          opacity: 0.4;
        }

        .circle-lg {
          width: 600px;
          height: 600px;
          animation: rotateCircles 4.5s ease-in-out alternate-reverse infinite;

          &::before {
            width: 200px;
            height: 200px;
          }
        }

        .circle-md {
          width: 300px;
          height: 300px;
          animation: rotateCircles 4s ease-in-out alternate-reverse infinite;

          &::before {
            width: 150px;
            height: 150px;
            background: #9214c7;
          }
        }

        .circle-sm {
          width: 150px;
          height: 250px;
          animation: rotateCircles 3.5s ease-in-out alternate-reverse infinite;

          &::before {
            width: 100px;
            height: 100px;
          }
        }
      }

      @keyframes rotateCircles {
        from {
          transform: rotate(0) scale(1);
          filter: blur(10);
          opacity: 0.8;
        }

        50% {
          transform: rotate(180deg) scale(1.4);
          filter: blur(5);
          opacity: 1;
        }

        to {
          transform: rotate(360deg) scale(1);
          filter: blur(10);
          opacity: 0.8;
        }
      }
    }

    ion-spinner {
      transform: scale(4);
      color: var(--app-voxxrin);
    }

    ion-text {
      display: block;
      margin-top: 16px;
      font-size: 18px;
      font-weight: 500;
      color: var(--app-primary);

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }

    .datasLabelsAnimation {
      height:44px;
      overflow:hidden;
      margin-top: 8px;

      & > div > div {
        height: 44px;
        margin-bottom: 2.81rem;
        display:inline-block;
      }

      div:first-child {
        animation: text-animation 20s infinite reverse;
      }

      &-label {
        width: 100%;
        text-align: center;
        font-weight: 900;
        color: var(--app-voxxrin);
      }
    }

    @keyframes text-animation {
      0% {margin-top: 0;}
      10% {margin-top: 0;}
      20% {margin-top: -5.62rem;}
      30% {margin-top: -5.62rem;}
      40% {margin-top: -11.24rem;}
      60% {margin-top: -11.24rem;}
      70% {margin-top: -5.62rem;}
      80% {margin-top: -5.62rem;}
      90% {margin-top: 0;}
      100% {margin-top: 0;}
    }

    .dataLabel {
      display: block;
      margin-top: 6px;
      font-size: 13px;
      font-weight: 900;
      color: var(--app-voxxrin);
    }
  }

  .exportActions {
    padding: 24px;
    background: var(--app-background);
  }
</style>
