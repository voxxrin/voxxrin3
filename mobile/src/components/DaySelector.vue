<template>
  <ion-list class="dayList">
    <ion-item  v-for="(day, index) in formattedDays" :key="index">
      <ion-button class="dayList-button" @click="$emit('day-selected', day)" :class="{ selected: day.id.isSameThan(selected?.id)}">
        <div class="dayList-button-content">
          <strong class="day">{{day.formatted.day}}</strong>
          <span class="month">{{day.formatted.month}}</span>
          <!-- {{day.localDate}} ( {{day.formatted.weekday}}
         {{day.formatted.year}})-->
        </div>
        <span class="currentDayIndicator" v-if="false"></span>
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

<style scoped lang="scss">
  .dayList  {
    display: flex;
    overflow-x: auto;
    background: var(--app-white);
    box-shadow: var(--app-shadow-light);

    ion-item {
      position: relative;
      min-width: 96px;
      --ion-item-background: transparent;
      --padding-top: 4px;
      --padding-bottom: 4px;
      --padding-end: 0px;
      --inner-padding-end: 0px;
      --inner-padding-start: 0px;
      --border-style: none;
      overflow: visible !important;
      flex: 1;

      &:last-child:after {
        display: none;
      }

      &:after {
        position: absolute;
        left: 74px;
        top: 50%;
        width: calc(100% - 68px);
        min-width: 32px;
        height: 0;
        border-bottom: 2px dotted var(--app-beige-line);;
        content: '';
        border-radius: 8px;
      }
    }

    &-button {
      display: flex;
      align-items: center;
      height: 44px;
      width: 44px;
      --border-radius: 44px;
      --border-width: 1px;
      --border-style: solid;
      --border-color: var(--app-primary);
      --background: transparent;
      overflow: visible !important;

      .currentDayIndicator {
        position: absolute;
        top: -8px;
        height: 12px;
        width: 12px;
        border-radius: 8px;
        background-color: var(--app-theme-hightlight);
      }

      &-content {
        display: flex;
        row-gap: 2px;
        align-items: center;
        flex-direction: column;
        justify-content: center;
        color: var(--app-primary);

        .day {
          font-size: 18px;
          display: block;
          font-weight: 900;
        }

        .month {
          display: -webkit-box;
          text-transform: uppercase;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 8px;
        }
      }

      &.selected {
        box-shadow: 0 0 0 4px rgba(var(--app-theme-primary-rgb), 0.3);
        border-radius: 44px;
        --border-color: var(--app-theme-primary);
        --background: var(--app-theme-primary);
        --background-activated: var(--app-theme-primary);
        transition: 140ms ease-in-out;

        &:active {
          transition: 140ms ease-in-out;
          box-shadow: 0 0 0 2px rgba(var(--app-theme-primary-rgb), 0.3);
        }

        .dayList-button-content {
          color: var(--app-white);
        }
      }

      &.paste {
        border-radius: 44px;
        --border-color: var(--app-grey-light);
        --background: var(--app-grey-light);
        --background-activated: var(--app-grey-line);
        transition: 140ms ease-in-out;


        .dayList-button-content {
          color: var(--app-grey-medium);
        }
      }
    }
  }
</style>
