<template>
  <ion-button class="powered" href="https://www.voxxr.in/" target="_blank" :aria-label="LL.Open_Voxxrin_website()">powered by
    <ion-icon :src="'/assets/images/svg/voxxrin-color-primary.svg'" alt="Voxxrin website" aria-hidden="true"></ion-icon>
  </ion-button>
</template>

<script setup lang="ts">
import {IonButton} from "@ionic/vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
const { LL } = typesafeI18n()
</script>

<style lang="scss" scoped>
.powered {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: 0;
  --padding: 8px 16px;
  font-size: 12px;
  --background: var(--app-beige-medium);
  --box-shadow: none;
  --border-radius: 12px 12px 0 0;
  --color: var(--app-primary);

  @media (prefers-color-scheme: dark) {
    --background: var(--app-dark-contrast);
    --color: var(--app-white);
  }

  ion-icon {
    width: 74px;
    height: 16px;
    margin-left: 4px;

    @media (prefers-color-scheme: dark) {
      .letters {
        fill: white !important;
      }
    }
  }
}
</style>
