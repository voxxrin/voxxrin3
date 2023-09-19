<template>
  <div :class="['linearRating', { '_small': isSmall }]">
    <ion-button v-for="(label, index) in config.labels" :key="index" @click="ratingSelected(index)">
      <ion-icon class="linearRating-icon" :icon="ICONS[config.icon]" :class="{ '_active': selectedIndex !== null && index <= selectedIndex}"></ion-icon>
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {PropType, ref} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {star, thumbsUp} from "ionicons/icons";
import {VoxxrinUserFeedback} from "@/models/VoxxrinFeedback";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("LinearRating");

const ICONS: Record<VoxxrinConferenceDescriptor['features']['ratings']['scale']['icon'], string> = {
    "star": star,
    "thumbs-up": thumbsUp
}

const props = defineProps({
    config: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor['features']['ratings']['scale']>
    },
    userFeedback: {
        required: false,
        type: Object as PropType<VoxxrinUserFeedback|undefined>
    },
    readonly: {
        required: false,
        type: Boolean
    },
    isSmall: {
        required: false,
        type: Boolean,
        default: false,
    },
})

const $emits = defineEmits<{
    (e: 'rating-selected', value: null|{ score: number, selectedLabel: string }): void
}>()

const selectedIndex = ref<number|null>(null);
if(props.userFeedback && props.userFeedback.ratings["linear-rating"] !== null) {
    selectedIndex.value = props.userFeedback.ratings["linear-rating"]-1;
    LOGGER.debug(() => `selected value: ${selectedIndex.value}`)
}
function ratingSelected(index: number) {
    if(props.readonly) {
        return;
    }

    if(selectedIndex.value === index) {
        selectedIndex.value = null;
    } else {
        selectedIndex.value = index;
    }
    $emits('rating-selected', selectedIndex.value===null?null:{ score: index+1, selectedLabel: props.config!.labels[index] })
}
</script>

<style lang="scss" scoped>

.linearRating {
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

  &._small {
    display: flex;
    padding-left: 8px;
    padding-right: 8px;
    border-left: 1px solid var(--app-beige-line);

    ion-button {
      height: 32px !important;
      width: 26px !important;
    }

    .linearRating-icon {
      font-size: 24px;
    }
  }
}
</style>
