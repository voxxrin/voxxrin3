<template>
  <ion-header class="stepHeader">
    <span class="stepHeader-nb">{{ step }}</span>
    {{ stepLabel }}
  </ion-header>
</template>

<script setup lang="ts">
const props = defineProps({
    step: {
        required: true,
        type: Number,
    },
    stepLabel: {
        required: true,
        type: String
    }
});

</script>

<style lang="scss" scoped>
.stepHeader {
  position: sticky;
  top: 68px;
  display: flex;
  align-items: center;
  column-gap: 8px;
  padding: 8px 16px;
  color: var(--app-white);
  font-weight: bold;
  background: var(--voxxrin-event-theme-colors-primary-hex);
  z-index: 2;

  &-nb {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    width: 34px;
    border-radius: 24px;
    color: var(--app-white);
    background-color: var(--app-primary);
  }
}
</style>
