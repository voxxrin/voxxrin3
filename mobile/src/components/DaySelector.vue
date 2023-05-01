<template>
  <ion-list>
    <ion-item v-for="(day, index) in formattedDays" :key="index">
      <ion-button @click="$emit('day-selected', day)" :class="{ selected: day.id.isSameThan(selected?.id)}" >
        {{day.localDate}} ( {{day.formatted.weekday}} {{day.formatted.day}} {{day.formatted.month}} {{day.formatted.year}})
      </ion-button>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import {IonButton, IonItem, IonList } from "@ionic/vue";
import {computed, PropType, watch} from "vue";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {localDateToReadableParts} from "@/models/DatesAndTime";
import {useCurrentUserLocale} from "@/state/CurrentUser";

defineEmits<{
    (e: 'day-selected', day: VoxxrinDay): void
}>()

const props = defineProps({
    days: {
        required: true,
        type: Array as PropType<VoxxrinDay[]>,
    },
    selected: {
        type: Object as PropType<VoxxrinDay|undefined>
    }
});

const formattedDays = computed(() => {
    return (props.days || []).map(d => ({
        ...d,
        formatted: localDateToReadableParts(d.localDate, useCurrentUserLocale())
    }))
})

</script>

<style scoped>
ion-button.selected {
  --background: red;
}
</style>
