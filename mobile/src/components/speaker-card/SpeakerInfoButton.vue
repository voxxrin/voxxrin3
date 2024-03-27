<template>
  <!-- TODO Dev Btn -->
  <ion-button class="btnActionCard" :aria-label="LL.View_Profil_Speaker()">
    <ion-icon  aria-hidden="true" src="/assets/icons/solid/info-circle.svg"></ion-icon>
  </ion-button>
</template>

<script setup lang="ts">
  import {typesafeI18n} from "@/i18n/i18n-vue";
  const { LL } = typesafeI18n()
</script>

<style scoped lang="scss">
  .btnActionCard {
    min-height: 36px !important;
    font-size: 18px;
  }
</style>
