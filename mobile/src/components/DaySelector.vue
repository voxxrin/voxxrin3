<template>
  <ion-list class="dayList">
    <ion-item  v-for="(day, index) in formattedDays" :key="index" :class="{past: today.localeCompare(day.localDate) === 1}">
      <div class="dayList-content">
        <ion-button class="dayList-button" @click="$emit('day-selected', day)" :class="{
          selected: day.id.isSameThan(selected?.id),
          past: today.localeCompare(day.localDate) === 1,
          today: today.localeCompare(day.localDate) === 0,
          future: today.localeCompare(day.localDate) === -1,
      }">
          <div class="dayList-button-content">
            <strong class="day">{{day.formatted.day}}</strong>
            <span class="month">{{day.formatted.month}}</span>
          </div>
        </ion-button>
      </div>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {VoxxrinDay} from "@/models/VoxxrinDay";
import {localDateToReadableParts} from "@/models/DatesAndTime";
import {useCurrentUserLocale} from "@/state/useCurrentUserLocale";
import {useInterval} from "@/views/vue-utils";
import {ISOLocalDate} from "../../../shared/type-utils";
import {useCurrentClock} from "@/state/CurrentClock";

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

const today = ref<ISOLocalDate>("0000-00-00")
useInterval(() => {
    today.value = useCurrentClock().zonedDateTimeISO().toPlainDate().toString() as ISOLocalDate
}, import.meta.env.DEV?{seconds:5}:{minutes:15}, { immediate: true })

const formattedDays = computed(() => {
    return (props.days || []).map(d => ({
        ...d,
        formatted: localDateToReadableParts(d.localDate, useCurrentUserLocale())
    }))
})

</script>

<style scoped lang="scss">
    %selected {
      box-shadow: 0 0 0 4px rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.3);
      border-radius: 44px;
      --border-color: var(--voxxrin-event-theme-colors-primary-hex);
      --background: var(--voxxrin-event-theme-colors-primary-hex);
      --background-activated: var(--voxxrin-event-theme-colors-primary-hex);
      --color: var(--voxxrin-event-theme-colors-primary-contrast-hex) !important;
      transition: 140ms ease-in-out;

      &:active {
        transition: 140ms ease-in-out;
        box-shadow: 0 0 0 2px rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.3);
      }
    }

  .dayList  {
    display: flex;
    overflow-x: auto;
    margin-left: -44px;
    margin-right: -34px;
    background: var(--voxxrin-event-theme-colors-primary-contrast-hex);
    box-shadow: rgba(var(--voxxrin-event-theme-colors-primary-contrast-rgb), 0.15);

    @media (prefers-color-scheme: dark) {
      background: rgba(var(--app-medium-contrast-rgb), 0.5);
    }

    &-content {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    ion-item {
      position: relative;
      min-width: 144px;
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
        right: calc(-50% + 24px);
        top: 50%;
        width: calc(100% - 64px);
        min-width: 32px;
        height: 0;
        border-bottom: 2px dashed var(--app-beige-line);
        content: '';
        border-radius: 8px;

        @media (prefers-color-scheme: dark) {
          border-bottom: 2px dashed var(--app-white);
        }
      }

      &.past:after {
        border-bottom: 2px solid var(--app-grey-light);

        @media (prefers-color-scheme: dark) {
          border-bottom: 2px solid var(--app-light-contrast);
        }
      }
    }

    &-button {
      display: flex;
      align-items: center;
      height: 44px;
      width: 44px;
      margin: 8px 0;
      --border-radius: 44px;
      --border-width: 1px;
      --border-style: solid;
      transition: 140ms ease-in-out;
      overflow: visible !important;

      &-content {
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: center;

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
          font-size: 11px;
          letter-spacing: -1px;
        }
      }

      &.past {
        border-radius: 44px;
        --border-color: var(--app-grey-light);
        --background: var(--app-grey-light);
        --background-activated: var(--app-grey-line);
        --color: var(--app-grey-medium);

        @media (prefers-color-scheme: dark) {
          --border-color: var(--app-dark-contrast);
          --background: var(--app-light-contrast);
          --background-activated: var(--app-dark);
          --color: var(--app-grey-medium);
        }

        &.selected {@extend %selected;}
      }

      &.today {
        --border-color: var(--voxxrin-event-theme-colors-primary-hex);
        --background: transparent;
        --background-activated: var(--app-grey-line);
        --color: var(--voxxrin-event-theme-colors-primary-hex);

        &.selected {@extend %selected;}
      }

      &.future {
        --border-color: var(--app-primary-shade);
        --background: transparent;
        --color: var(--app-primary-shade);

        @media (prefers-color-scheme: dark) {
          --border-color: var(--app-white);
          --color: var(--app-white);
        }

        &.selected { @extend %selected;}
      }
    }
  }
</style>
