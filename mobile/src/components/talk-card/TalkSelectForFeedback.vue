<template>
  <ion-button :class="{ 'btnActionCard': true, 'btn-feedbackSelect': true, '_is-active': isActive }"
              :aria-label="LL.Select_for_feedback()">
    <ion-icon class="active" aria-hidden="true" src="assets/icons/solid/comment-feedback-select.svg"/>
    <ion-icon class="inactive" aria-hidden="true"  src="assets/icons/line/comment-line-add.svg"/>
  </ion-button>
</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()
const props = defineProps({
    isActive: {
        required: true,
        type: Boolean
    }
});
</script>

<style scoped lang="scss">

.btn-feedbackSelect {
  font-size: 22px;

  &._is-active {
    --background: var(--ion-color-primary);
    --color: var(--voxxrin-event-theme-colors-secondary-tertiary-hex);
    border-left: 1px solid var(--voxxrin-event-theme-colors-tertiary-hex);
    color: white;

    @media (prefers-color-scheme: dark) {
      --background: var(--app-white);

      ion-icon {
        color: var(--app-primary);
      }
    }
  }

  .active { display: none;}
  .inactive { display: block;}
  &._is-active .active { display: block; }
  &._is-active .inactive { display: none; }
}
</style>
