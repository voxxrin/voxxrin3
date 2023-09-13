<template>
  <div class="barSection">
    <span class="barSection-title">
      <slot name="title"></slot>
    </span>
    <span class="barSection-content">
        <slot name="content"></slot>
    </span>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
.barSection {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px var(--app-gutters);
  background-color: var(--app-beige-line);

  &-title {
    font-weight: 900;
    color: var(--app-primary);
  }
}
</style>
