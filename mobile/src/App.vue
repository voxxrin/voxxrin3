<template>
  <ion-app :style="animationVariables">
    <div v-if="!userAuthenticatedRef" class="page-loader">
      <ion-spinner></ion-spinner>
      <p><em>{{LL.On_flacky_connections_it_is_difficult_to_authenticate_the_user()}}</em></p>
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
    })
})

useDevUtilities();
</script>

<style lang="scss" scoped>
.page-loader {
  top:30%;
  left:50%;
  position: fixed;
  transform: translate(-50%, -30%);
  width: 100%;
}

ion-spinner {
  width: 100px;
  height: 100px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
