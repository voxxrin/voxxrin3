<template>
  <ion-segment :value="selectedModeRef" class="listModesSwitch">
    <ion-segment-button v-for="mode in modes" :key="mode.id" class="listModesSwitch-button"
                        :value="mode.id" :aria-label="mode.label"
                        @click="() => updateSelectedModeTo(mode.id)">
      <ion-icon :icon="mode.icon" aria-hidden="true"></ion-icon>
    </ion-segment-button>
  </ion-segment>
</template>

<script setup lang="ts">
  import {IonSegment, IonSegmentButton} from "@ionic/vue";
  import {PropType, ref} from "vue";

  const props = defineProps({
    modes: {
      required: true,
      type: Array as PropType<Array<{id: string, icon: string, label: string, preSelected?: boolean}>>,
    },
  })

  const $emits = defineEmits<{
    (e: 'mode-updated', updatedModeId: string, previousModeId: string|undefined): void
  }>()

  const selectedModeRef = ref<string|undefined>(props.modes?.find(mode => !!mode.preSelected)?.id)

  function updateSelectedModeTo(updatedModeId: string) {
    const previousModeId = selectedModeRef.value;
    selectedModeRef.value = updatedModeId;
    $emits('mode-updated', updatedModeId, previousModeId);
  }
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
