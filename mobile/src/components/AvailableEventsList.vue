<template>
  <div v-if="events.length>0">
    <ion-list>
      <div class="container" :style="{
          '--conf-background-url': event.backgroundUrl,
          '--conf-logo-url': event.logoUrl,
          '--conf-theme-color': event.themeColor
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
    IonList,
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
  background-color: var(--conf-theme-color);
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
