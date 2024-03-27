<template>
  <!-- TODO #74 Dev btn and custom option / icons depending on context -->
  <ion-segment value="buttons" class="listModesSwitch">
    <ion-segment-button class="listModesSwitch-button" value="default" :aria-label="LL.Big_list_mode()">
      <ion-icon :icon="albums" aria-hidden="true"></ion-icon>
    </ion-segment-button>
    <ion-segment-button class="listModesSwitch-button" value="segment" :aria-label="LL.Compact_list_mode()">
      <ion-icon :icon="list" aria-hidden="true"></ion-icon>
    </ion-segment-button>
  </ion-segment>
</template>

<script setup lang="ts">
  import {albums, list} from "ionicons/icons";
  import {IonSegment, IonSegmentButton} from "@ionic/vue";
  import {typesafeI18n} from "@/i18n/i18n-vue";

  const { LL } = typesafeI18n()
</script>

<style lang="scss">
  :root {
    --listModeSwitch-height: 44px;
    --listModeSwitch-button-height: 38px;
  }

  .listModesSwitch {
    width: fit-content;
    min-height: inherit;
    background-color: var(--app-background);
    border-radius: var(--listModeSwitch-height);
    border: 1px solid var(--app-beige-line);

    ::part(native) {
      border-radius: var(--listModeSwitch-height);
    }

    ::part(indicator) {
      height: 100%;
      padding: 0;
      z-index: -1;
    }

    ::part(indicator-background) {
      height: 100%;
      border-radius: var(--listModeSwitch-height);
      background-color: var(--app-primary);

      @media (prefers-color-scheme: dark) {
        background-color: var(--app-white);
      }
    }

    &-button {
      position: relative;
      height: var(--listModeSwitch-button-height);
      width: 52px;
      min-width: 48px;
      min-height: inherit;
      margin: 0;
      --border-radius: var(--listModeSwitch-height);
      --background-checked: transparent;
      --color: var(--app-primary);
      --color-checked: var(--app-white);
      --indicator-height: 44px;

      @media (prefers-color-scheme: dark) {
        --color: var(--app-white);
        --color-checked: var(--app-primary);
      }

      &._active {
        --background: var(--app-primary);
        --background-activated: var(--app-primary);
        --color: var(--app-white);

        @media (prefers-color-scheme: dark) {
          --background: var(--app-white);
          --background-activated: var(--app-white);
          --color: var(--app-primary);
          --ion-toolbar-background: var(--app-primary);
        }
      }
    }
}
</style>
