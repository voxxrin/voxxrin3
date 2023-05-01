<template>
  <ion-list>
    <ion-item v-for="(day, index) in days" :key="index">
      <ion-button @click="$emit('day-selected', day)" :class="{ selected: day.id.isSameThan(selected?.id)}" >
        {{day.localDate}}
      </ion-button>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import {IonButton, IonItem, IonList } from "@ionic/vue";
import {PropType} from "vue";
import {VoxxrinDay} from "@/models/VoxxrinDay";

defineEmits<{
    (e: 'day-selected', day: VoxxrinDay): void
}>()

defineProps({
    days: {
        required: true,
        type: Array as PropType<VoxxrinDay[]>,
    },
    selected: {
        type: Object as PropType<VoxxrinDay|undefined>
    }
});

</script>

<style scoped>
ion-button.selected {
  --background: red;
}
</style>
