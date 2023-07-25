<template>
  <ion-button :class="{ 'btnTalk': true, 'btn-feedbackSelect': true, '_is-active': isActive }">
    <ion-icon class="active" aria-hidden="true" src="assets/icons/solid/comment-feedback-select.svg"/>
    <ion-icon class="inactive" aria-hidden="true"  src="assets/icons/line/comment-line.svg"/>
  </ion-button>
</template>

<script setup lang="ts">
const props = defineProps({
    isActive: {
        required: true,
        type: Boolean
    }
});
</script>

<style scoped lang="scss">
.btn-feedbackSelect {
  &._is-active {
    --background: var(--voxxrin-event-theme-colors-secondary-hex);
    --color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);
    border-left: 1px solid var(--voxxrin-event-theme-colors-secondary-hex);
  }

  .active { display: none; }
  .inactive { display: block; }
  &._is-active .active { display: block; }
  &._is-active .inactive { display: none; }
}
</style>
