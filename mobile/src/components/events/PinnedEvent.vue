<template>
  <ion-card class="pinnedEvent-card" v-themed-event-styles="pinnedEvent">
    <current-event-status :conf-descriptor="pinnedEvent"/>
    <div>
      <div class="pinnedEvent-card-head">
        <ion-card-title class="title">{{pinnedEvent.title}}</ion-card-title>
        <!-- TODO 77 - Add key for infos edition year -->
        <ion-text class="subTitle">8éme Éditon - 2023</ion-text>
      </div>

      <div class="pinnedEvent-card-content">
        <div class="description" v-if="pinnedEvent.description">
          {{pinnedEvent.description}}
        </div>
        <ul class="details">
          <li>
            <ion-icon aria-hidden="true" src="/assets/icons/solid/calendar.svg" />
            <ion-label>
              <month-day-date-range :range="{ start: pinnedEvent.start, end: pinnedEvent.end }" /> {{pinnedEvent.start.year}}
            </ion-label>
          </li>
          <li>
            <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg" />
            <ion-label class="location">{{pinnedEvent.location.city}}{{pinnedEvent.location.country?` (${pinnedEvent.location.country})`:``}}</ion-label>
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
</template>

<script setup lang="ts">
import {people} from "ionicons/icons";
import CurrentEventStatus from "@/components/events/CurrentEventStatus.vue";
import MonthDayDateRange from "@/components/MonthDayDateRange.vue";
import {IonImg} from "@ionic/vue";
import {PropType} from "vue";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";

const props = defineProps({
    pinnedEvent: {
        required: true,
        type: Object as PropType<ListableVoxxrinEvent>
    }
})

</script>

<style lang="scss" scoped>
.pinnedEvent-card {
  color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 268px;
  height: 268px;
  margin: var(--app-gutters) 0;
  border-radius: var(--app-bloc-radius);
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
    flex-direction: column;
    padding: 32px var(--app-gutters) 8px var(--app-gutters);

    .title {
      --color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
      font-size: 20px;
      font-weight: 900;
      text-overflow: ellipsis;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
    }

    .subTitle {
      display: block;
      font-size: 16px;
      --color: var(--app-white);
      z-index: 1;
      opacity: 0.8;
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

    .location {
      font-weight: normal;
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
    background: linear-gradient(90deg, rgba(var(--voxxrin-event-theme-colors-primary-contrast-rgb),1) 59%, rgba(var(--voxxrin-event-theme-colors-primary-contrast-rgb),0) 100%);
    border-radius: 0 0 var(--app-gutters) var(--app-gutters);
    z-index: 1;

    ion-img {
      height: 38px;
      width: 94px;
    }
  }
}

</style>
