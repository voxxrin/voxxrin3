<template>
  <div v-if="favoritedEvents.length>0" class="favoritedEventsContainer">
    <ion-list class="favoritedEvents">
      <ion-card class="favoritedEvents-card" :style="{
          '--conf-background-url': `url('${favoritedEvent.backgroundUrl}')`,
          '--conf-logo-url': `url('${favoritedEvent.logoUrl}')`,
          '--conf-theme-color': favoritedEvent.themeColor
      }" v-for="(favoritedEvent, index) in favoritedEvents" :key="index"
                @click="$emit('event-selected', favoritedEvent)">
        <current-event-status :event="favoritedEvent"/>
        <div>
          <div class="favoritedEvents-card-head">
            <ion-card-title class="title">{{favoritedEvent.title}}</ion-card-title>
          </div>

          <div class="favoritedEvents-card-content">
            <div class="description" v-if="favoritedEvent.description">
              {{favoritedEvent.description}}
            </div>
            <ul class="details">
              <li>
                <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg" />
                <ion-label>{{favoritedEvent.location.city}}{{favoritedEvent.location.country?` (${favoritedEvent.location.country})`:``}}</ion-label>
              </li>
              <li>
                <ion-icon aria-hidden="true" src="/assets/icons/solid/calendar.svg" />
                <ion-label>
                  <month-day-date-range :range="{ start: favoritedEvent.start, end: favoritedEvent.end }" />
                </ion-label>
              </li>
              <li v-if="favoritedEvent.peopleDescription">
                <ion-icon aria-hidden="true" :icon="people" />
                <ion-label>{{favoritedEvent.peopleDescription}}</ion-label>
              </li>
            </ul>
          </div>
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
    IonImg,
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

.favoritedEventsContainer {
  overflow-y: auto;
}

.favoritedEvents {
  display: inline-flex;
  flex-direction: row;
  column-gap: var(--app-gutters);
  padding: 0 var(--app-gutters);
  background: transparent;
  contain: initial;

  &-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 268px;
    height: 268px;
    margin: var(--app-gutters) 0;
    border-radius: 16px;
    background-image: linear-gradient(to bottom, var(--conf-theme-color) 50%, transparent 200%),var(--conf-background-url);
    contain: initial;
    overflow: visible;
    filter: drop-shadow(0px 4px 24px rgba(0, 0, 0, 0.16));
    transition: 80ms ease-in-out;

    &:active {
      transition: 80ms ease-in-out;
      transform: scale(0.99);
      box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
    }

    ion-badge {
      position: absolute;
      right: -4px;
      top: -1px;
      transform: scale(0.9);
      border-radius: 0 16px 0 8px;
    }

    &-head {
      display: flex;
      flex-direction: row;
      padding: 32px var(--app-gutters) 8px var(--app-gutters);

      .title {
        font-size: 22px;
        font-weight: 900;
        color: var(--app-white);
        text-overflow: ellipsis;
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        mix-blend-mode: difference;
      }
    }

    &-content {
      padding: 0 var(--app-gutters);

      .description {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        font-size: 13px;
        line-height: 1.4;
        color: var(--app-white);
        mix-blend-mode: difference;
      }

      .details {
        margin: var(--app-gutters) 0;
        padding: 0;

        li {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          color: var(--app-white);
          list-style: none;
          font-size: 12px;
          font-weight: 700;
          mix-blend-mode: difference;

          ion-icon {
            font-size: 16px;
            width: 24px;
          }
        }
      }
    }

    .logo {
      padding: 12px var(--app-gutters);
      background-color: var(--app-white);
      border-radius: 0 0 var(--app-gutters) var(--app-gutters);

      ion-img {
        width: 124px;
      }
    }
  }
}
</style>
