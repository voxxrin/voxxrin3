<template>
  <div v-if="events.length>0">
    <ion-list>
      <div class="container" :style="{
          '--voxxrin-event-background-url': `url('${event?.backgroundUrl}')`,
          '--voxxrin-event-logo-url': `url('${event?.logoUrl}')`,
          '--voxxrin-event-theme-colors-primary-hex': event?.theming.colors.primaryHex,
          '--voxxrin-event-theme-colors-primary-rgb': event?.theming.colors.primaryRGB,
          '--voxxrin-event-theme-colors-primary-contrast-hex': event?.theming.colors.primaryContrastHex,
          '--voxxrin-event-theme-colors-primary-contrast-rgb': event?.theming.colors.primaryContrastRGB,
          '--voxxrin-event-theme-colors-secondary-hex': event?.theming.colors.secondaryHex,
          '--voxxrin-event-theme-colors-secondary-rgb': event?.theming.colors.secondaryRGB,
          '--voxxrin-event-theme-colors-secondary-contrast-hex': event?.theming.colors.secondaryContrastHex,
          '--voxxrin-event-theme-colors-secondary-contrast-rgb': event?.theming.colors.secondaryContrastRGB,
          '--voxxrin-event-theme-colors-tertiary-hex': event?.theming.colors.tertiaryHex,
          '--voxxrin-event-theme-colors-tertiary-rgb': event?.theming.colors.tertiaryRGB,
          '--voxxrin-event-theme-colors-tertiary-contrast-hex': event?.theming.colors.tertiaryContrastHex,
          '--voxxrin-event-theme-colors-tertiary-contrast-rgb': event?.theming.colors.tertiaryContrastRGB,
      }" v-for="(event, index) in events" :key="index" @click="$emit('event-clicked', event)">
        <div class="logo">
          <ion-img :src="event.logoUrl" />
        </div>
        <div class="title">{{event.title}}</div>
        <div class="location">
          {{event.location.city}}, {{event.location.country}}
        </div>
        <div class="dates"><month-day-date-range :format="{separator: '>'}" :range="{start: event.start, end: event.end}" /></div>
        <div class="year">{{event.start.year}}</div>
      </div>
    </ion-list>
  </div>
  <div v-else>
    <slot name="no-event"></slot>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
    IonImg
} from '@ionic/vue';
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import MonthDayDateRange from "@/components/MonthDayDateRange.vue";

const props = defineProps({
    events: {
        required: true,
        type: Object as PropType<Array<ListableVoxxrinEvent>>
    }
})

defineEmits<{
    (e: 'event-clicked', event: ListableVoxxrinEvent): void
}>()

</script>

<style lang="scss" scoped>
.container {  display: grid;
  grid-template-columns: 80px 1fr min-content;
  grid-template-rows: 1fr 1fr;
  grid-auto-columns: 1fr;
  gap: 0px 0px;
  grid-auto-flow: row dense;
  grid-template-areas:
    "logo title dates"
    "logo location year";
  width: 400px;
  height: 80px;
}

.logo {
  justify-self: center;
  align-self: center;
  grid-area: logo;
  background-color: var(--voxxrin-event-theme-colors-primary-hex);
  width: 60px;
  height: 60px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 10px;
}

.title {
  align-self: stretch;
  grid-area: title;
}

.location {
  align-self: end;
  grid-area: location;
}

.dates {
  align-self: end;
  grid-area: dates;
}

.year {
  align-self: start;
  grid-area: year;
}
</style>
