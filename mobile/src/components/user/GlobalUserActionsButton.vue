<template>
  <ion-button class="btnUser" shape="round" size="large" @click="if(false){$router.push(`/user/dashboard`);}">
    <ion-icon src="/assets/icons/line/user-line.svg"></ion-icon>
    <ion-ripple-effect type="unbounded"></ion-ripple-effect>
  </ion-button>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.btnUser {
  height: 58px;
  width: 58px;
  border: 1px solid var(--app-beige-line);
  --padding-end: 0;
  --padding-start: 0;
  --background: var(--app-beige-medium);
  --color: var(--app-beige-dark);
  --background-activated-opacity: 0.2;
  --background-focused-opacity: 0.2;
  --background-hover-opacity: 0.2;
  border-radius: 58px;

  ion-icon {
    font-size: 32px;
  }

  @media (prefers-color-scheme: dark) {
    --background: var(--app-dark-contrast);
    --color: var(--app-white);
    border: none;
  }
}
</style>
