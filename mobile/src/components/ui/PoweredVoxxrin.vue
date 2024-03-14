<template>
  <ion-text class="powered">powered by
    <ion-icon :src="'/assets/images/svg/voxxrin-color-primary.svg'"></ion-icon>
  </ion-text>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
.powered {
  display: flex;
  flex-direction: row;
  justify-content: center;
  column-gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  background-color: var(--app-beige-medium);
  border-radius: 12px 12px 0 0;

  @media (prefers-color-scheme: dark) {
    background-color: var(--app-dark-contrast);
  }

  ion-icon {
    width: 74px;
    height: 16px;

    @media (prefers-color-scheme: dark) {
      .letters {
        fill: white !important;
      }
    }
  }
}
</style>
