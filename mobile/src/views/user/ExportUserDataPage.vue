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
          <span class="step1 illu-export" v-if="false"></span>

          <!-- Step 2 -->
          <div class="step2 urlLink" v-if="false">
            <span class="qrcode">
              <ion-img :src="'assets/images/svg/qrcode-demo.svg'"></ion-img>
            </span>
            <span class="url">
              url.import.voxxrin.d4f4545454ez
            </span>
          </div>

          <!-- Step 3 -->
          <div class="step3 import" v-if="true">
            <div class="import-blur">
              <div class="circle">
                <div class="circle circle-lg">
                  <div class="circle circle-md">
                    <div class="circle circle-sm"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="importContentOverlay">
              <div class="linesTransfert">
                <span class="line"></span>
                <span class="line"></span>
                <span class="line"></span>
                <span class="line"></span>
                <span class="line"></span>
                <span class="line"></span>
                <span class="line"></span>
              </div>
              <div class="importProgress">
                <ion-img class="importProgress-loader" :src="'/assets/images/gif/spinner.gif'"></ion-img>
                <ion-text class="importProgress-title">Data transfer in progress...</ion-text>
                <div class="datasLabelsAnimation">
                  <div class="datasLabelsAnimation-label _first"><div>My kick-ass program</div></div>
                  <div class="datasLabelsAnimation-label _second"><div> My best feedback</div></div>
                  <div class="datasLabelsAnimation-label _third"><div>My params</div></div>
                </div>
              </div>
              <div class="importFinish" v-if="true">
                <ion-icon :icon="checkmarkCircle"></ion-icon>
                <ion-text class="importFinish-title">Data transfer is now complete!</ion-text>
                <ul class="importFinish-stats">
                  <li>Impacted conferences <strong>3</strong></li>
                  <li>Favorites<strong>30</strong></li>
                  <li>Feedbacks<strong>12</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer class="exportActions">
      <!-- Step 1 -->
      <div class="export-option">
        Export my feedback
        <ion-toggle></ion-toggle>
      </div>
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
import {checkmarkCircle, copy, download} from "ionicons/icons";
import Callout from "@/components/ui/Callout.vue";

const { LL } = typesafeI18n()

const step = ref(1)
setTimeout(() => { step.value = 2; }, 3000)
setTimeout(() => { step.value = 3; }, 6000)
setTimeout(() => { step.value = 4; }, 9000)

const {registerTabbedPageNavListeners, triggerTabbedPageExitOrNavigate} = useTabbedPageNav()
registerTabbedPageNavListeners();
</script>

<style lang="scss" scoped>
  /* Head & Layout */
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

  .importContentOverlay {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400px;
    width: 400px;
    border-radius: 600px;
    background: transparent;
    overflow: hidden;
  }

  /* Step 2 */
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

  /* Step 3 */
  .import {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: scale-in-center 340ms cubic-bezier(0.250, 0.460, 0.450, 0.940) both;

    &._importSuccess {

      .import-blur {
        .circle {
          &:before { background: rgba(var(--app-green-rgb), 0.2);}
          .circle-sm, .circle-md, .circle-lg { animation: inherit !important;}
        }
      }

      .importProgress {
        display: none;
        visibility: collapse;
        animation: slide-out-blurred-bottom 0.45s cubic-bezier(0.755, 0.050, 0.855, 0.060) both;
      }

      .importFinish {
        display: block;
        visibility: visible;
        animation: slide-in-blurred-top 0.6s cubic-bezier(0.230, 1.000, 0.320, 1.000) both;
      }

      .linesTransfert {
        display: none;
      }

      &:after {
        background: rgba(var(--app-green-rgb), 0.05);
        box-shadow: rgb(var(--app-green-rgb) / 5%) -4px -19px 60px -12px inset, rgb(var(--app-green-rgb) / 21%) 0px 18px 36px -18px inset;
        animation: inherit !important;
      }
    }

    .importProgress {
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;

      &-loader {
        height: 140px;
        width: 124px;
      }

      &-title {
        display: block;
        margin-top: 16px;
        font-size: 18px;
        font-weight: 500;
        color: var(--app-primary);

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }

      /* Labels */
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
    }

    .importFinish {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      visibility: collapse;
      display: none;

      &-title {
        display: block;
        margin-top: 16px;
        font-size: 18px;
        font-weight: 900;
        color: var(--app-green);

        @media (prefers-color-scheme: dark) {
          color: var(--app-green);
        }
      }

      &-stats {
        padding: 0;
        margin: 0;
        margin-top: 24px;

        li {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          column-gap: 8px;
          margin-bottom: 8px;

          strong {
            font-weight: 900;
            color: var(--app-voxxrin);
          }
        }
      }

      ion-icon {
        font-size: 64px;
        color: var(--app-green);
      }
    }

    /* ===== Decoration Import */
    /* Bubble Circle */
    &:after {
      position: absolute;
      height: 400px;
      width: 400px;
      border-radius: 500px;
      backdrop-filter: blur(30px) saturate(120%);
      background: rgba(white, 0.5);
      animation: scaleUpDown 4s ease-in-out alternate-reverse infinite;
      box-shadow: rgb(0 0 0 / 5%) -4px -19px 60px -12px inset, rgb(50 50 93 / 21%) 0px 18px 36px -18px inset;
      content: '';
      z-index: -2;

      @media (prefers-color-scheme: dark) {
        background: rgba(#242935, 0.5);
        box-shadow: rgb(255 255 255 / 5%) -4px -19px 60px -12px inset, rgb(255 255 255 / 21%) 0px 18px 36px -18px inset;
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

    /* Lines animations */
    .linesTransfert {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      row-gap: 38px;
      position: absolute;
      top: 50%;
      left: -50%;
      transform: translate(0, -50%) scale(0.5);
      width: calc(100% + 44px);
      z-index: 5;

      .line {
        display: block;
        height: 4px;
        width: 100%;
        background: linear-gradient(270deg, rgba(233, 8, 102, 0) 34%, rgba(233, 8, 102, 0.15) 50%, rgba(251, 109, 168, 0) 73%);
        background-size: 300% 100%;
        animation: animateBg-1c8dca9b 2s linear infinite, animateRandom-1c8dca9b 2s linear infinite;
        border-radius: 8px;

        @media (prefers-color-scheme: dark) {
          background: linear-gradient(270deg, rgba(white, 0) 34%, rgba(white, 0.15) 50%, rgba(white, 0) 73%);
        }
      }

      .line:nth-child(1) {
        animation-delay: 0.5s; /* Ajustez le délai comme vous le souhaitez */
      }
      .line:nth-child(2) {
        animation-delay: 1.2s; /* Ajustez le délai comme vous le souhaitez */
      }
      .line:nth-child(3) {
        animation-delay: 0.8s; /* Ajustez le délai comme vous le souhaitez */
      }
      .line:nth-child(4) {
        animation-delay: 1.2s; /* Ajustez le délai comme vous le souhaitez */
      }
      .line:nth-child(5) {
        animation-delay: 0.7s; /* Ajustez le délai comme vous le souhaitez */
      }
      .line:nth-child(6) {
        animation-delay: 1.1s; /* Ajustez le délai comme vous le souhaitez */
      }
    }

    @keyframes animateBg {
      0% { background-position: 100% 0%; }
      100% { background-position: 0% 0%; }
    }

    @keyframes animateRandom {
      0% {
        transform: translateX(0);
        opacity: 0;
      }
      100% {
        transform: translateX(calc(100% + 10px));
        opacity: 1;
      }
    }

    @keyframes animateBg {
      0% { background-position: 100% 0%; }
      100% { background-position: 0% 0%; }
    }
  }

  /* Footer */
  .exportActions {
    padding: 24px;
    background: var(--app-background);

    .export-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 24px 0;
      width: 100%;
    }
  }
</style>
