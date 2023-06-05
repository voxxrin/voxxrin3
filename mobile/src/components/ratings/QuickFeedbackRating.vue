<template>
  <ion-list>
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
import {PropType, ref} from "vue";
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
  ion-list {
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
</style>
