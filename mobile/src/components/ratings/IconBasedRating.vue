<template>
  <div class="iconBasedRating">
    <ul class="iconBasedRating-list">
      <li>
        <ion-button v-for="(customIconChoice, index) in config.choices" :key="customIconChoice.id" @click="ratingSelected(customIconChoice)">
          <ion-icon :icon="ICONS[customIconChoice.icon]" :class="{ '_active': selectedId !== null && customIconChoice.id === selectedId}"></ion-icon>
        </ion-button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {PropType, ref} from "vue";
import {
    VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {handRight, happy, sad, star, thumbsDown, thumbsUp} from "ionicons/icons";

export type CustomIconChoiceEntry = VoxxrinConferenceDescriptor['features']['ratings']['custom-scale']['choices'][number];

const ICONS: Record<CustomIconChoiceEntry['icon'], string> = {
    "happy": happy,
    "sad": sad,
    "thumbs-up": thumbsUp,
    "thumbs-down": thumbsDown,
    "hand-right": handRight
}

const props = defineProps({
    config: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor['features']['ratings']['custom-scale']>
    }
})

const $emits = defineEmits<{
    (e: 'rating-selected', value: string|null): void
}>()

const { LL } = typesafeI18n()

const selectedId = ref<string|null>(null)

function ratingSelected(choice: CustomIconChoiceEntry) {
    if(selectedId.value === choice.id) {
        selectedId.value = null;
    } else {
        selectedId.value = choice.id;
    }
    $emits('rating-selected', selectedId.value)
}
</script>

<style scoped lang="scss">
.iconBasedRating {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;

  &-list {
    display: flex;
    flex-direction: row;
    flex: 1;
    justify-content: end;
    column-gap: 4px;
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;

    ion-button {
      --background: transparent;
      --box-shadow: none;
      --padding-top: 0;
      --padding-start: 0;
      --padding-end: 0;
      --ripple-color: var(--voxxrin-event-theme-colors-primary-hex);
      --border-radius: 24px;

      @media (prefers-color-scheme: dark) {
        --background: transparent !important;
        --ripple-color: var(--app-grey-medium);
      }
    }

    ion-icon {
      font-size: 34px;
      color: var(--app-beige-dark);
      opacity: 0.5;

      &._active {
        opacity: 1;
        color: var(--voxxrin-event-theme-colors-primary-hex);
      }
    }
  }
}
</style>
