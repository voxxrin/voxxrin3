<template>
  <div v-if="favoritedEvents.length>0">
    <ion-list >
      <ion-card class="container" :style="{ 'background-url': favoritedEvent.backgroundUrl }"
                v-for="(favoritedEvent, index) in favoritedEvents" :key="index"
                @click="$emit('event-selected', favoritedEvent)">
        <current-event-status :event="favoritedEvent" style="position: absolute; right: 0px;" />
        <ion-card-title class="title">{{favoritedEvent.title}}</ion-card-title>
        <div class="description" v-if="favoritedEvent.description">
          {{favoritedEvent.description}}
        </div>
        <div class="details">
          <ul>
            <li>
              <ion-icon :icon="location" />
              <ion-label>{{favoritedEvent.location.city}}{{favoritedEvent.location.country?` (${favoritedEvent.location.country})`:``}}</ion-label>
            </li>
            <li>
              <ion-icon :icon="calendar" />
              <ion-label>
                <month-day-date-range :range="{ start: favoritedEvent.start, end: favoritedEvent.end }" />
              </ion-label>
            </li>
            <li v-if="favoritedEvent.peopleDescription">
              <ion-icon :icon="people" />
              <ion-label>{{favoritedEvent.peopleDescription}}</ion-label>
            </li>
          </ul>
        </div>
        <div class="logo">
          <ion-img :src="favoritedEvent.logoUrl" />
        </div>
      </ion-card>
    </ion-list>
  </div>
  <div v-else>
    <slot name="no-favorites"></slot>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
    IonIcon,
    IonCard,
    IonItem,
    IonList,
    IonCardTitle,
    IonLabel,
    IonImg, IonContent
} from '@ionic/vue';
import {calendar, location, people} from "ionicons/icons";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import {localDateToReadableParts} from "@/models/DatesAndTime";
import {useCurrentUserLocale} from "@/state/CurrentUser";
import CurrentEventStatus from "@/components/CurrentEventStatus.vue";
import MonthDayDateRange from "@/components/MonthDayDateRange.vue";

const props = defineProps({
    favoritedEvents: {
        required: true,
        type: Object as PropType<Array<ListableVoxxrinEvent>>
    }
})

defineEmits<{
    (e: 'event-selected', event: ListableVoxxrinEvent): void
}>()

function showEventTimeRange(event: ListableVoxxrinEvent) {
    const readableStartingParts = localDateToReadableParts(event.start, useCurrentUserLocale(), {
        day: 'numeric',
        month: 'short',
        year: undefined,
        weekday: undefined
    })

    if(event.days.length === 1) {
        return readableStartingParts.full;
    } else {
        const readableEndingParts = localDateToReadableParts(event.end, useCurrentUserLocale(), {
            day: 'numeric',
            month: 'short',
            year: undefined,
            weekday: undefined
        })

        return `${readableStartingParts.full} - ${readableEndingParts.full}`
    }
}

</script>

<style lang="scss" scoped>
.container {  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 70px 1fr 1fr 50px;
  grid-auto-columns: 1fr;
  gap: 0px 0px;
  grid-auto-flow: row dense;
  grid-template-areas:
    "title"
    "description"
    "details"
    "logo";
  width: 300px;
  height: 300px;
}

.description { grid-area: description; }

.title { grid-area: title; }

.details { grid-area: details; }

.logo { grid-area: logo; }
</style>
