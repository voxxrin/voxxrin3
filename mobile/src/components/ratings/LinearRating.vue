<template>
  <div class="linearRating">
    <span class="linearRating-value">
      <span v-if="selectedIndex !== undefined">{{config.labels[selectedIndex]}}</span>
    </span>
    <ul class="linearRating-list">
      <li>
        <ion-button v-for="(label, index) in config.labels" :key="index" @click="ratingSelected(index)">
          <ion-icon :icon="ICONS[config.icon]" :class="{ '_active': selectedIndex !== undefined && index <= selectedIndex}"></ion-icon>
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
import {star, thumbsUp} from "ionicons/icons";

const ICONS: Record<VoxxrinConferenceDescriptor['features']['ratings']['scale']['icon'], string> = {
    "star": star,
    "thumbs-up": thumbsUp
}

const props = defineProps({
    config: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor['features']['ratings']['scale']>
    }
})

const $emits = defineEmits<{
    (e: 'rating-selected', value: { score: number, selectedLabel: string }): void
}>()

const { LL } = typesafeI18n()

const selectedIndex = ref<number|undefined>(undefined)

function ratingSelected(index: number) {
    selectedIndex.value = index;
    $emits('rating-selected', { score: index+1, selectedLabel: props.config!.labels[index] })
}
</script>

<style scoped lang="scss">
.linearRating {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;

  &-value {
    font-weight: bold;
    width: 124px;
    font-size: 18px;
    color: var(--voxxrin-event-theme-colors-primary-hex);
  }

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
