<template>
  <div v-if="pinnedEvents.length>0" class="pinnedEventsContainer">
    <ion-list class="pinnedEvents">
      <ion-card class="pinnedEvents-card" :style="{
          '--voxxrin-event-background-url': `url('${pinnedEvent.backgroundUrl}')`,
          '--voxxrin-event-logo-url': `url('${pinnedEvent.logoUrl}')`,
          '--voxxrin-event-theme-colors-primary-hex': pinnedEvent.theming.colors.primaryHex,
          '--voxxrin-event-theme-colors-primary-rgb': pinnedEvent.theming.colors.primaryRGB,
          '--voxxrin-event-theme-colors-primary-contrast-hex': pinnedEvent.theming.colors.primaryContrastHex,
          '--voxxrin-event-theme-colors-primary-contrast-rgb': pinnedEvent.theming.colors.primaryContrastRGB,
          '--voxxrin-event-theme-colors-secondary-hex': pinnedEvent.theming.colors.secondaryHex,
          '--voxxrin-event-theme-colors-secondary-rgb': pinnedEvent.theming.colors.secondaryRGB,
          '--voxxrin-event-theme-colors-secondary-contrast-hex': pinnedEvent.theming.colors.secondaryContrastHex,
          '--voxxrin-event-theme-colors-secondary-contrast-rgb': pinnedEvent.theming.colors.secondaryContrastRGB,
          '--voxxrin-event-theme-colors-tertiary-hex': pinnedEvent.theming.colors.tertiaryHex,
          '--voxxrin-event-theme-colors-tertiary-rgb': pinnedEvent.theming.colors.tertiaryRGB,
          '--voxxrin-event-theme-colors-tertiary-contrast-hex': pinnedEvent.theming.colors.tertiaryContrastHex,
          '--voxxrin-event-theme-colors-tertiary-contrast-rgb': pinnedEvent.theming.colors.tertiaryContrastRGB,
      }" v-for="(pinnedEvent, index) in pinnedEvents" :key="index"
                @click="$emit('event-selected', pinnedEvent)">
        <current-event-status :event="pinnedEvent"/>
        <div>
          <div class="pinnedEvents-card-head">
            <ion-card-title class="title">{{pinnedEvent.title}}</ion-card-title>
          </div>

          <div class="pinnedEvents-card-content">
            <div class="description" v-if="pinnedEvent.description">
              {{pinnedEvent.description}}
            </div>
            <ul class="details">
              <li>
                <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg" />
                <ion-label>{{pinnedEvent.location.city}}{{pinnedEvent.location.country?` (${pinnedEvent.location.country})`:``}}</ion-label>
              </li>
              <li>
                <ion-icon aria-hidden="true" src="/assets/icons/solid/calendar.svg" />
                <ion-label>
                  <month-day-date-range :range="{ start: pinnedEvent.start, end: pinnedEvent.end }" />
                </ion-label>
              </li>
              <li v-if="pinnedEvent.peopleDescription">
                <ion-icon aria-hidden="true" :icon="people" />
                <ion-label>{{pinnedEvent.peopleDescription}}</ion-label>
              </li>
            </ul>
          </div>
        </div>
        <div class="logo">
          <ion-img :src="pinnedEvent.logoUrl" />
        </div>
      </ion-card>
    </ion-list>
  </div>
  <div v-else>
    <slot name="no-pinned-events"></slot>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
    IonImg,
} from '@ionic/vue';
import {people} from "ionicons/icons";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import CurrentEventStatus from "@/components/CurrentEventStatus.vue";
import MonthDayDateRange from "@/components/MonthDayDateRange.vue";

const props = defineProps({
    pinnedEvents: {
        required: true,
        type: Object as PropType<Array<ListableVoxxrinEvent>>
    }
})

defineEmits<{
    (e: 'event-selected', event: ListableVoxxrinEvent): void
}>()

</script>

<style lang="scss" scoped>

.pinnedEventsContainer {
  overflow-y: auto;
}

.pinnedEvents {
  display: inline-flex;
  flex-direction: row;
  column-gap: var(--app-gutters);
  padding: 0 var(--app-gutters);
  background: transparent;
  contain: initial;

  &-card {
    color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 268px;
    height: 268px;
    margin: var(--app-gutters) 0;
    border-radius: 16px;
    background-image: linear-gradient(to bottom, var(--voxxrin-event-theme-colors-primary-hex) 50%, transparent 200%),var(--voxxrin-event-background-url);
    contain: initial;
    overflow: visible;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    transition: 140ms;
    animation: scale-up-center 140ms cubic-bezier(0.390, 0.575, 0.565, 1.000) both;

    &:before {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 100%;
      background: linear-gradient(0deg, rgba(0,0,0,0) 0, rgba(0,0,0,0.4) 200%);
      border-radius: 16px;
      content:'';
      z-index: 0;
    }

    &:active {
      transition: 140ms;
      transform: scale(0.97) !important;
      box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
    }

    ion-badge {
      position: absolute;
      right: 0;
      top: 0;
      padding: 0 16px;
      border-radius: 0 16px 0 8px;
    }

    &-head {
      display: flex;
      flex-direction: row;
      padding: 32px var(--app-gutters) 8px var(--app-gutters);

      .title {
        --color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
        font-size: 22px;
        font-weight: 900;
        text-overflow: ellipsis;
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
      }
    }

    &-content {
      padding: 0 var(--app-gutters);

      .description {
        position: relative;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        font-size: 13px;
        line-height: 1.4;
        z-index: 1;
      }

      .details {
        position: relative;
        margin: var(--app-gutters) 0;
        padding: 0;
        z-index: 1;

        li {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          list-style: none;
          font-size: 12px;
          font-weight: 700;

          ion-icon {
            font-size: 16px;
            width: 24px;
          }
        }
      }
    }

    .logo {
      padding: 8px var(--app-gutters);
      background: linear-gradient(90deg, rgba(255,255,255,1) 59%, rgba(255,255,255,0) 100%);
      border-radius: 0 0 var(--app-gutters) var(--app-gutters);
      z-index: 1;

      ion-img {
        height: 38px;
        width: 94px;
      }
    }
  }
}

@keyframes scale-up-center {
  0% { transform: scale(0.5);}
  100% { transform: scale(1);}
}
</style>
