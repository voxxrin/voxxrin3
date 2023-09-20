<template>
  <div class="linearRating">
    <span class="linearRating-value">
      <span>{{selectedLabelRef}}</span>
    </span>
    <ul class="linearRating-list">
      <li>
        <linear-rating :config="config" @rating-selected="result => ratingSelected(result)" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
    VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {managedRef as ref} from "@/views/vue-utils";
import {typesafeI18n} from "@/i18n/i18n-vue";
import LinearRating from "@/components/ratings/LinearRating.vue";

const props = defineProps({
    config: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor['features']['ratings']['scale']>
    }
})

const $emits = defineEmits<{
    (e: 'rating-selected', value: null|{ score: number, selectedLabel: string }): void
}>()

const { LL } = typesafeI18n()

const selectedLabelRef = ref("");
function ratingSelected(result: null|{score:number, selectedLabel: string}) {
    selectedLabelRef.value = result === null ? '' : result.selectedLabel;
    $emits('rating-selected', result===null?null:result)
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
  }
}
</style>
