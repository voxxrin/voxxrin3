<template>
  <ion-item class="onlyDay" v-if="formattedDays.length === 1">
    <ion-icon src="/assets/icons/solid/calendar.svg"></ion-icon>
    <strong class="day">{{formattedDays[0].formatted.day}}</strong>
    <span class="month">{{formattedDays[0].formatted.month}}</span>
  </ion-item>

  <ion-list class="dayList" v-if="formattedDays.length > 1">
    <ion-item  v-for="(day, index) in formattedDays" :key="day.id.value" :class="{past: today.localeCompare(day.localDate) === 1}">
      <div class="dayList-content">
        <ion-button class="dayList-button" @click="$emit('day-selected', day)" :class="{
          selected: day.id.isSameThan(selectedDayId),
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

<!--  <ion-item class="multiDay" v-if="formattedDays.length > 3">-->
<!--    <ion-grid>-->
<!--      <ion-row class="ion-align-items-center">-->
<!--        <ion-col class="multiDay-pick">-->
<!--          <a :class="{ 'multiDay-pick-link': true, _active: today.localeCompare(selectedDay.localDate) === 0 }"-->
<!--             @click="$emit('day-selected', findDayByLocalDate(today))"-->
<!--          >{{ LL.Today() }}</a>-->
<!--          <a :class="{ 'multiDay-pick-link': true, _active: tomorrow.localeCompare(selectedDay.localDate) === 0 }"-->
<!--             @click="$emit('day-selected', findDayByLocalDate(tomorrow))"-->
<!--          >{{ LL.Tomorrow() }}</a>-->
<!--        </ion-col>-->
<!--        <ion-col size="4">-->
<!--          <ion-select :value="selectedDayId?.value" @ionChange="$emit('day-selected', findDayByIdValue($event.detail.value))">-->
<!--            <ion-select-option-->
<!--                v-for="(day, index) in formattedDays" :key="day.id.value"-->
<!--                :value="day.id.value"-->
<!--            >{{day.formatted.full}}</ion-select-option>-->
<!--          </ion-select>-->
<!--        </ion-col>-->
<!--      </ion-row>-->
<!--    </ion-grid>-->
<!--  </ion-item>-->
</template>

<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
import {localDateToReadableParts, toISOLocalDate} from "@/models/DatesAndTime";
import {useCurrentUserLocale} from "@/state/useCurrentUserLocale";
import {useInterval} from "@/views/vue-utils";
import {ISOLocalDate} from "../../../shared/type-utils";
import {useCurrentClock} from "@/state/useCurrentClock";
import {IonGrid} from "@ionic/vue";
import {typesafeI18n} from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()

defineEmits<{
    (e: 'day-selected', day: VoxxrinDay): void
}>()

const props = defineProps({
    days: {
        required: true,
        type: Array as PropType<VoxxrinDay[]>,
    },
    selectedDayId: {
        type: Object as PropType<DayId|undefined>
    }
});

const selectedDay = computed(() => {
    return props.days.find(d => d.id.isSameThan(props.selectedDayId));
})
const today = ref<ISOLocalDate>("0000-00-00")
const tomorrow = ref<ISOLocalDate>("0000-00-00")
useInterval(() => {
    let todayZDT = useCurrentClock().zonedDateTimeISO();
    today.value = toISOLocalDate(todayZDT)
    tomorrow.value = toISOLocalDate(todayZDT.add({days:1}))
}, {minutes:1}, { immediate: true })

const formattedDays = computed(() => {
    return (props.days || []).map(d => ({
        ...d,
        formatted: localDateToReadableParts(d.localDate, useCurrentUserLocale())
    }))
})

function findDayByIdValue(dayIdValue: string) {
    return props.days?.find(day => day.id.value === dayIdValue);
}
function findDayByLocalDate(localDate: string) {
    return props.days?.find(day => day.localDate === localDate);
}

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
    padding: 0;
    background: var(--voxxrin-event-theme-colors-primary-contrast-hex);
    box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;

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

  .onlyDay {
    position: relative;
    --padding-start: 0;
    --padding-end: 0;
    --border-style: none;
    align-items: baseline;

    @media (prefers-color-scheme: dark) {
      --background: rgba(var(--app-medium-contrast-rgb), 0.5);
    }

    ion-icon {
      position: absolute;
      top: -2px;
      left: -14px;
      display: inline-block;
      font-size: 58px;
      color: var(--app-primary);
      opacity: 0.1;
      z-index: -1;

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }

    .day {
      display: flex;
      align-items: center;
      padding :{
        top: 8px;
        bottom: 8px;
        left: 16px;
        right: 8px;
      }

      font-size: 34px;
      font-weight: 900;
      color: var(--voxxrin-event-theme-colors-primary-hex);
    }

    .month {
      font-size: 24px;
      --color: var(--app-primary);
    }
  }

  .multiDay {
    position: relative;
    --border-style: none;
    align-items: baseline;

    @media (prefers-color-scheme: dark) {
      --background: rgba(var(--app-medium-contrast-rgb), 0.5);
    }

    ion-grid { padding: 0;}

    &-pick {
      display: flex;
      flex-direction: row;
      padding: 0;
      column-gap: 16px;

      &-link {
        font-size: 16px;

        &._active {
          font-weight: bold;
          color: var(--voxxrin-event-theme-colors-primary-hex);
        }
      }
    }
  }
</style>
