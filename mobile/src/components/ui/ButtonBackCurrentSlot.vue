<template>
  <!-- TODO #84 connect the back current slot button -->
  <transition name="scaleUp">
    <ion-fab class="buttonBackCurrentSlot" vertical="bottom" horizontal="start" slot="fixed">
      <ion-fab-button class="buttonBackTop" @click=""
                      :aria-label="LL.Go_Back_Current_Slot()">
        <ion-icon src="/assets/icons/solid/pick-current-slot.svg" :aria-hidden="true"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </transition>
</template>

<script setup lang="ts">
import { IonFab,IonFabButton } from '@ionic/vue';
import { typesafeI18n } from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()
</script>


<style lang="scss">
  .buttonBackCurrentSlot {
    ion-fab-button {
      --background: var(--app-primary);
      --color: var(--app-white);

      @media (prefers-color-scheme: dark) {
        --background: var(--app-white);
        --color: var(--app-primary);
      }
    }
  }
</style>
