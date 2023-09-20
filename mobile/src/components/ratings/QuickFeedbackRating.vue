<template>
  <ion-list class="public-bingo" v-if="config.isPublic">
    <!-- TODO Add class _checked + add variable theme events -->
    <ion-item v-for="(choice, index) in config.choices"
              :key="choice.id"
              class="quickFeedbackItem"
              :class="{'_checked': selectedChoices.includes(choice.id)}">
      <ion-checkbox :checked="selectedChoices.includes(choice.id)"
                    :name="choice.id"
                    @ionChange="ratingToggled(choice.id)">
      </ion-checkbox>
      <div class="quickFeedbackItem-infos">
        <span class="label">{{ choice.label }}</span>
        <span class="total"><strong>12</strong> Votes</span>
      </div>
      <canvas class="quickFeedbackItem-canvas"></canvas>
    </ion-item>
  </ion-list>
  <ion-list class="private-bingo" v-else>
    <ion-item v-for="(choice, index) in config.choices" :key="choice.id">
      <ion-checkbox justify="space-between"
                    :checked="selectedChoices.includes(choice.id)"
                    :name="choice.id"
                    @ionChange="ratingToggled(choice.id)">
        {{ choice.label }}
      </ion-checkbox>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {managedRef as ref} from "@/views/vue-utils";
import {
    VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonCheckbox} from "@ionic/vue";

const props = defineProps({
    config: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor['features']['ratings']['bingo']>
    }
})

const $emits = defineEmits<{
    (e: 'rating-selected', value: string[]): void
}>()

const { LL } = typesafeI18n()

const selectedChoices = ref<string[]>([])

function ratingToggled(choiceId: string) {
    if(selectedChoices.value.includes(choiceId)) {
        selectedChoices.value = selectedChoices.value.filter(id => choiceId !== id)
    } else {
        selectedChoices.value = selectedChoices.value.concat(choiceId);
    }
    $emits('rating-selected', selectedChoices.value);
}
</script>

<style scoped lang="scss">
  ion-list.private-bingo {
    margin-bottom: 16px;
    padding-top: 0;
    background: transparent;

    ion-item {
      --background: transparent !important;
      --padding-end: 0;

      &:last-child {
        --border-style: none;
      }
    }
  }
  ion-list.public-bingo {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    row-gap: 8px;
    column-gap: 12px;
    margin-bottom: 12px;
    padding-top: 0;
    background: transparent;

    .quickFeedbackItem {
      --padding-end: 0;
      --padding-start: 0;
      --inner-padding-end: 0;
      text-align: center;
      background-color: var(--app-background);
      border: 2px solid var(--app-beige-medium);
      border-radius: 12px;
      --background: transparent !important;
      --inner-border-width: 0;

      &._checked {
        background-color: var(--app-beige-medium);
        border: 2px solid var(--app-primary);

        * {
          color: var(--app-primary);
          font-weight: 900;
        }
      }

      ion-checkbox {
        position: absolute;
        height: 100%;
        width: 100%;
        display: none;
      }

      &-infos {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 8px 0;
        row-gap: 4px;

        .label {
          font-weight: 500;
          width: 100%;
          color: var(--app-grey-dark);
        }

        .total {
          font-weight: 500;
          width: 100%;
          font-size: 13px;
          color: var(--app-grey-dark);
        }
      }

      &-canvas {
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: -1;
      }
    }
  }
</style>
