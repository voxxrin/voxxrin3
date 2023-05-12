<template>
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
    }" @click="$emit('event-clicked', event)">
      <ion-ripple-effect type="bounded"></ion-ripple-effect>
      <div class="eventItem-logoContainer">
        <div class="logo">
          <ion-img :src="event.logoUrl" />
        </div>
      </div>
      <div class="eventItem-infos">
        <div class="title">{{event.title}}</div>
        <div class="timeInfos">
          <ion-icon aria-hidden="true" src="/assets/icons/solid/calendar.svg"></ion-icon>
          <month-day-date-range :format="{separator: '>'}" :range="{start: event.start, end: event.end}" />
          {{event.start.year}}
        </div>
        <div class="location">
          <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon> {{event.location.city}}, {{event.location.country}}
        </div>
      </div>

      <div class="eventItem-end" slot="end">
        <ion-button fill="clear" shape="round" @click.stop="$emit('event-fav-toggled', event, isFavorited?'fav-to-unfav':'unfav-to-fav')">
          <ion-icon src="/assets/icons/line/pin-line.svg" v-if="!isFavorited"></ion-icon>
          <ion-icon class="_is-pined" src="/assets/icons/solid/pin.svg" v-if="isFavorited"></ion-icon>
        </ion-button>
      </div>
    </ion-item>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import {
    IonImg,
} from '@ionic/vue';
import {EventId, ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import MonthDayDateRange from "@/components/MonthDayDateRange.vue";

const props = defineProps({
    event: {
        required: true,
        type: Object as PropType<ListableVoxxrinEvent>
    },
    favoritedEvents: {
        required: true,
        type: Object as PropType<Array<EventId>>
    },
})

defineEmits<{
    (e: 'event-clicked', event: ListableVoxxrinEvent): void,
    (e: 'event-fav-toggled', event: ListableVoxxrinEvent, transitionType: 'unfav-to-fav'|'fav-to-unfav'): void,
}>()

const isFavorited = computed(() => {
    if(props.favoritedEvents && props.event) {
        return !!props.favoritedEvents?.find(eventId => props.event?.id.isSameThan(eventId))
    } else {
        return false;
    }
})

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

    .timeInfos {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-top: 14px;
      margin-bottom: 4px;
      column-gap: 4px;
      font-size: 13px;
      font-weight: 500;
      text-align: end;
      color: var(--app-grey-light);

      @media (prefers-color-scheme: dark) {
        color: var(--app-beige-dark);
      }

      ion-icon {
        font-size: 16px;
        color: var(--app-beige-dark);

        @media (prefers-color-scheme: dark) {
          color: var(--app-grey-dark);
        }
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
    margin-inline-end: 24px;

    ion-icon {
      width: 34px;
      font-size: 34px;
      color: var(--app-grey-medium);
    }

    ._is-pined {
      color: var(--app-voxxrin) !important;
    }
  }
}
</style>
