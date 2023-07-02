<template>
  <ion-footer class="feedBackFooter">
    <ion-toolbar>
      <slot name="details"></slot>
      <div class="feedBackFooter-group">
        <slot></slot>
      </div>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup lang="ts">

import {IonFooter, IonToolbar} from "@ionic/vue";
</script>

<style lang="scss" scoped>
.feedBackFooter {

  ion-toolbar {
    --background: var(--app-white);
    --padding-top: 8px;
    --padding-bottom: 8px;
    --padding-start: 4px;
    --padding-end: 4px;
    --min-height: 44px;
    box-shadow: 0 3px 20px rgba(0, 0, 0, 0.5);

    @media (prefers-color-scheme: dark) {
      --background: var(--app-background);
    }
  }

  &-group {
    display: flex;
    column-gap: 8px;
    margin-top: 8px;

    :deep(ion-button:first-child) { width: 128px}
    :deep(ion-button:last-child) { flex: 1;}
  }
}
</style>
