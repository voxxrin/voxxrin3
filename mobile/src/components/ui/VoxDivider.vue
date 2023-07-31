<template>
  <div class="divider">
    <span class="titleDivider"><slot></slot></span>
    <span class="divider-separator"></span>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
.divider {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;

  .titleDivider {
    font-weight: bold;
    color: var(--app-primary-shade);

    @media (prefers-color-scheme: dark) {
      opacity: 0.8;
      color: var(--app-grey-light);
    }
  }

  .divider-separator {
    display: block;
    height: 1px;
    width: 100%;
    margin-left: 16px;
    background-color: var(--app-beige-line);
    flex: 1;

    @media (prefers-color-scheme: dark) {
      background-color: var(--app-line-contrast);
    }
  }
}
</style>
