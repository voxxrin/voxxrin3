<template>
  <!-- TODO Dev Btn -->
  <ion-button class="btnActionCard" :class="{ 'btnActionCard': true, '_is-active': true }" :aria-label="LL.Like_Speaker()">
        <span class="btnActionCard-group">
           <ion-icon class="btnActionCard-group-icon" v-if="true" aria-hidden="true" src="/assets/icons/line/heart-line.svg"></ion-icon>
           <ion-icon class="btnActionCard-group-icon" v-if="false" aria-hidden="true" src="/assets/icons/solid/heart.svg"></ion-icon>
           <ion-label class="btnActionCard-group-nb" v-if="true">-</ion-label>
        </span>
  </ion-button>
</template>

<script setup lang="ts">
  import {typesafeI18n} from "@/i18n/i18n-vue";
  const { LL } = typesafeI18n()
</script>

<style scoped lang="scss">
.btnActionCard {

  &._is-active {
    --background: var(--voxxrin-event-theme-colors-primary-hex);
    --color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
    border-left: 1px solid var(--app-primary-shade);
    --border-radius:  0 0 8px 0 !important;
  }
}
</style>
