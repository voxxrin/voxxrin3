<template>
  <ion-app :style="animationVariables">
    <div v-if="!userAuthenticatedRef" class="page-loader" role="status" aria-live="polite">
      <img class="page-loader-logo" src="/assets/imgs/logo128.png" alt="" />
      <ion-spinner name="crescent"></ion-spinner>
      <p class="page-loader-title">{{LL.App_is_starting()}}</p>
      <p class="page-loader-hint" v-if="slowStartupRef">{{LL.On_flacky_connections_it_is_difficult_to_authenticate_the_user()}}</p>
    </div>
    <AuthenticatedUserContextProvider v-if="currrentUserRef" :user="currrentUserRef" />
    <ion-router-outlet v-if="userAuthenticatedRef" />
  </ion-app>
  <pwa-reload-prompt />
</template>

<script setup lang="ts">
import {IonApp, IonRouterOutlet} from '@ionic/vue';
import PwaReloadPrompt from "@/components/PwaReloadPrompt.vue";
import {useDevUtilities} from "@/state/useDevUtilities";
import {TimeslotAnimations} from "@/services/Animations";
import {signInAnonymously} from "firebase/auth";
import {useFirebaseAuth} from "vuefire";
import {Logger} from "@/services/Logger";
import {managedRef as ref} from "@/views/vue-utils";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {P} from "ts-pattern";
import {useCurrentUser} from "@/state/useCurrentUser";
import AuthenticatedUserContextProvider from "@/components/user/AuthenticatedUserContextProvider.vue";

const LOGGER = Logger.named("App")

const animationVariables = {
  '--app-voxxrin-animations-timeslots-anim-base-delay': `${TimeslotAnimations.ANIMATION_BASE_DELAY.total('milliseconds')}ms`,
  '--app-voxxrin-animations-timeslots-anim-duration': `${TimeslotAnimations.ANIMATION_DURATION.total('milliseconds')}ms`,
}

const { LL } = typesafeI18n()

const auth = useFirebaseAuth()!

const userAuthenticatedRef = ref(false);
// On "lie-fi" networks, Firebase Auth init waits for a token refresh request
// that can hang up to ~30s: explain what happens only if startup is noticeably slow
const slowStartupRef = ref(false);
const slowStartupTimer = setTimeout(() => slowStartupRef.value = true, 3000);
const currrentUserRef = useCurrentUser();
new Promise(async resolve => {
    // Resolving early this part, because we don't want to wait for anonymous sign in prior
    // to starting the app (otherwise, we get infamous white screen™)
    resolve(null);

    // await new Promise(resolve => setTimeout(resolve, 30000))

    LOGGER.info(() => `Starting anonymous sign in...`)


    // await disableNetwork(db);
    signInAnonymously(auth).then((anonymousUser) => {
        LOGGER.info(() => `Anonymous sign in performed !`)
        userAuthenticatedRef.value = true;
        clearTimeout(slowStartupTimer);
    })
})

useDevUtilities();
</script>

<style lang="scss" scoped>
// Body background is black (for the iOS translucent status bar): loader needs its own
// opaque background, otherwise spinner & text are rendered black-on-black
.page-loader {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  background: var(--app-background);
  color: var(--ion-text-color, #000);
  text-align: center;
}

.page-loader-logo {
  width: 72px;
  height: 72px;
  border-radius: 18px;
}

ion-spinner {
  width: 32px;
  height: 32px;
  color: var(--app-voxxrin);
}

.page-loader-title {
  margin: 0;
  font-weight: 700;
  font-size: 18px;
}

.page-loader-hint {
  margin: 0;
  max-width: 320px;
  font-size: 14px;
  line-height: 1.4;
  opacity: 0.7;
  animation: page-loader-fade-in 400ms ease-out;
}

@keyframes page-loader-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 0.7; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .page-loader-hint { animation: none; }
}
</style>
