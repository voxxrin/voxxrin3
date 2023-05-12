<template>
  <div v-if="events.length>0">
    <ion-list>
      <ion-item class="eventItem" :style="{
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
      }" v-for="(event, index) in events" :key="index">
        <ion-ripple-effect type="bounded"></ion-ripple-effect>
        <div class="eventItem-logoContainer">
          <div class="logo">
            <ion-img :src="event.logoUrl" />
          </div>
        </div>
        <div class="eventItem-infos">
          <div class="title">{{event.title}}</div>
          <div class="location">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon> {{event.location.city}}, {{event.location.country}}
          </div>
        </div>

        <div class="eventItem-end" slot="end" @click="$emit('event-clicked', event)">
          <div class="eventItem-end-time">
            <div class="dates"><month-day-date-range :format="{separator: '>'}" :range="{start: event.start, end: event.end}" /></div>
            <div class="year">{{event.start.year}}</div>
          </div>
          <ion-icon src="/assets/icons/solid/more-menu-vertical.svg"></ion-icon>
        </div>
      </ion-item>
    </ion-list>
  </div>
  <div v-else>
    <slot name="no-event"></slot>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
    IonImg,
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

.eventItem {
  display: flex;
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: var(--app-background);

  @media (prefers-color-scheme: dark) {
    --border-color: var(--app-line-contrast);
  }

  &-logoContainer {
    padding: var(--app-gutters) ;

    .logo {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
      width: 68px;
      height: 68px;
      padding: 8px;
      filter: drop-shadow(0px 1px 4px rgba(0, 0, 0, 0.15));
      border: 2px solid var(--voxxrin-event-theme-colors-primary-hex);
      border-radius: 28px 28px 8px 28px;
      overflow: hidden;

      &:before {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: 100%;
        width: 100%;
        background: radial-gradient(circle,rgba(255,255,255,0) 0, rgba(var(--voxxrin-event-theme-colors-primary-rgb),1) 140%);
        content: '';
        z-index: -1;
      }
    }
  }

  &-infos {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: {
      top: calc(var(--app-gutters) + 4px);
      bottom: calc(var(--app-gutters) + 4px);
      right: 0;
      left: 0;
    }

    .title {
      font-size: 16px;
      font-weight: bold;
      word-break: break-word;
      color: var(--app-primary);

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }

    .location {
      display: flex;
      align-items: center;
      column-gap: 4px;
      color: var(--app-beige-dark);
      font-size: 13px;
      text-align: left;
      word-break: break-word;

      ion-icon {
        font-size: 16px;
        color: var(--app-grey-dark);
      }
    }
  }

  &-end {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    margin-inline-start: 8px;

    &-time {
      display: flex;
      flex-direction: column;
      justify-content: end;
      font-size: 13px;
      text-align: end;

      .dates {
        display: block;
        font-weight: 700;
        text-transform: uppercase;
      }

      .year {
        display: block;
      }
    }

    ion-icon {
      width: 34px;
      font-size: 34px;
      color: var(--app-grey-medium);
    }
  }
}
</style>
