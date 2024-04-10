<template>
  <!-- TODO #84 connect the back button to the top of the page -->
  <transition name="scaleUp">
    <ion-fab vertical="bottom" horizontal="start" slot="fixed">
      <ion-fab-button class="buttonBackTop" @click=""
                      :aria-label="LL.Go_Back_Screen()">
        <ion-icon :icon="arrowUpSharp"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </transition>
</template>

<script setup lang="ts">
import { IonFab,IonFabButton } from '@ionic/vue';
import { typesafeI18n } from "@/i18n/i18n-vue";
import { arrowUpSharp } from "ionicons/icons";

const { LL } = typesafeI18n()
</script>


<style lang="scss">
  .buttonBackTop {
    ion-fab-button {
      height: 44px;
      width: 44px;
      --background: var(--app-primary);
      --color: var(--app-white);

      @media (prefers-color-scheme: dark) {
        --background: var(--app-white);
        --color: var(--app-primary);
      }
    }
  }
</style>
