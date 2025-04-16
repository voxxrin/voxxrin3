<template>
  <div class="slotOverlap" v-if="overlappingTimeslots.length > 0">
    <ion-icon aria-hidden="true" src="assets/icons/solid/slot-overlay.svg"></ion-icon>
    <span class="slotOverlap-txt">
      <small>{{LL.Overlaps_x_slot_label()}}</small>
      <strong>{{LL.Overlaps_x_slot_value({nrOfOverlappingSlots: overlappingTimeslots.length})}}</strong>
    </span>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()

const props = defineProps({
    overlappingTimeslots: {
        required: true,
        type: Array as PropType<Array<any>>,
    }
});
</script>

<style lang="scss" scoped>
.slotOverlap {
  display: flex;
  align-items: center;
  column-gap: 4px;
  padding: 2px 8px 2px 4px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background-color: white;
  color: var(--voxxrin-event-theme-colors-secondary-hex);

  ion-icon {
    font-size: 16px;
  }

  &-txt {
    display: flex;
    flex-direction: column;
    line-height: 0.9;

    strong {
      color: var(app-black);
    }

    small {
      opacity: 0.8;
    }
  }
}
</style>
