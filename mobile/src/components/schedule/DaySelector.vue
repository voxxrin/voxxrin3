<template>
  <ion-item class="onlyDay" v-if="formattedDays.length === 1">
    <ion-icon src="/assets/icons/solid/calendar.svg"></ion-icon>
    <strong class="day">{{formattedDays[0].formatted.day}}</strong>
    <span class="month">{{formattedDays[0].formatted.month}}</span>
  </ion-item>

  <ion-list class="dayList" v-if="formattedDays.length > 1">
    <ion-item  v-for="(day, index) in formattedDays" :key="day.id.value" :class="{past: today.localeCompare(day.localDate) === 1}">
      <div class="dayList-content">
        <ion-button class="dayList-button" @click="changeDayTo(day)" :class="{
          selected: day.id.isSameThan(currentlySelectedDayIdRef),
          past: today.localeCompare(day.localDate) === 1,
          today: today.localeCompare(day.localDate) === 0,
          future: today.localeCompare(day.localDate) === -1,
        }" :aria-label="LL.View_day() + ' ' + day.formatted.day + ' ' + day.formatted.month">
          <span v-if="today.localeCompare(day.localDate) === 0"
                class="todayIndicator">
          </span>
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
import {computed, PropType, toValue, watch} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {DayId, VoxxrinDay} from "@/models/VoxxrinDay";
import {localDateToReadableParts, toISOLocalDate} from "@/models/DatesAndTime";
import {useCurrentUserLocale} from "@/state/useCurrentUser";
import {ISOLocalDate} from "../../../../shared/type-utils";
import {useCurrentClock, watchClock} from "@/state/useCurrentClock";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {spacedEventIdOf, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useSharedEventSelectedDay} from "@/state/useEventSelectedDay";
import {getLocalStorageKeyCompound} from "@/services/Spaces";

const { LL } = typesafeI18n()

const emits = defineEmits<{
    (e: 'once-initialized-with-day', day: VoxxrinDay, days: VoxxrinDay[]): void,
    (e: 'day-selected', day: VoxxrinDay): void
}>()

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>,
    }
});

const confDescriptorRef = toRef(props, 'confDescriptor');
const spacedEventIdRef = toRef(() => spacedEventIdOf(toValue(confDescriptorRef)))
const persistedLocalStorageDayKeyName = computed(() => `${getLocalStorageKeyCompound(spacedEventIdRef)}-selected-day`)

const {selectedDayId: currentlySelectedDayIdRef, setSelectedDayId} = useSharedEventSelectedDay(spacedEventIdRef);

const selectedDayIdUniqueInitializationWatchCleaner = watch([confDescriptorRef, currentlySelectedDayIdRef], ([confDescriptor, selectedDayId]) => {
    if(confDescriptor && confDescriptor.days.length) {
        // Making everything into an async block, so that selectedDayIdUniqueInitializationWatchCleaner
        // gets initialized
        setTimeout(() => {
            const availableDays = confDescriptor.days;

            let updatedSelectedDayId: DayId|undefined = undefined;
            if(selectedDayId !== undefined) {
                updatedSelectedDayId = selectedDayId;
            }

            const persistedSelectedDayId = localStorage.getItem(persistedLocalStorageDayKeyName.value)
            // If nothing pre-selected at component mounting, trying to pre-select day based on localstorage...
            if(updatedSelectedDayId === undefined && persistedSelectedDayId) {
                updatedSelectedDayId = confDescriptorRef.value?.days.find(d => d.id.value === persistedSelectedDayId)?.id || undefined;
            }

            // If nothing loaded from localstorage, trying to guess best auto selectable day
            if(updatedSelectedDayId === undefined) {
                updatedSelectedDayId = findBestAutoselectableConferenceDay(availableDays).id;
            }

            if(updatedSelectedDayId !== undefined) {
                selectedDayIdUniqueInitializationWatchCleaner();
                setSelectedDayId(updatedSelectedDayId);
                emits('once-initialized-with-day', confDescriptor.days.find(d => d.id.isSameThan(updatedSelectedDayId))!, availableDays)
            }
        })
    }
}, {immediate: true})


function findBestAutoselectableConferenceDay(days: VoxxrinDay[]): VoxxrinDay {
    const today = toISOLocalDate(useCurrentClock().zonedDateTimeISO())
    const confDayMatchingToday = days.find(d => d.localDate === today)
    return confDayMatchingToday || days[0];
}

const today = ref<ISOLocalDate>("0000-00-00")
const tomorrow = ref<ISOLocalDate>("0000-00-00")
watchClock({freq: 'low-frequency'}, (now) => {
  today.value = toISOLocalDate(now)
  tomorrow.value = toISOLocalDate(now.add({days:1}))
})

const formattedDays = computed(() => {
    return (confDescriptorRef.value.days || []).map(d => ({
        ...d,
        formatted: localDateToReadableParts(d.localDate, useCurrentUserLocale())
    }))
})

const changeDayTo = (day: VoxxrinDay) => {
    setSelectedDayId(day.id);
    localStorage.setItem(persistedLocalStorageDayKeyName.value, day.id.value);
    emits('day-selected', day)
}

function findDayByIdValue(dayIdValue: string) {
    return confDescriptorRef.value.days.find(day => day.id.value === dayIdValue);
}
function findDayByLocalDate(localDate: string) {
    return confDescriptorRef.value.days.find(day => day.localDate === localDate);
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
      min-width: 100%;
      width: fit-content;
      padding: 0;
      background: rgba(white, 0.6);
      -webkit-backdrop-filter:  blur(30px) saturate(120%);
      backdrop-filter:  blur(30px) saturate(120%);
      box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;

      @media (prefers-color-scheme: dark) {
        border-bottom: 1px solid var(--app-line-contrast);
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
      min-width: 124px;
      --ion-item-background: transparent;
      --padding-top: 4px;
      --padding-bottom: 4px;
      --padding-end: 0px;
      --inner-padding-end: 0px;
      --inner-padding-start: 0px;
      --border-style: none;
      overflow: visible !important;
      flex: 1;

      &:first-child {
        --padding-start: 16px;
      }

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
        border-bottom: 2px solid var(--voxxrin-event-theme-colors-primary-hex);
        content: '';
        border-radius: 8px;

        @media (prefers-color-scheme: dark) {
          border-bottom: 2px solid var(--app-white);
        }
      }

      &.past:after {
        border-bottom: 2px dashed var(--app-beige-line);

        @media (prefers-color-scheme: dark) {
          border-bottom: 2px dashed var(--app-light-contrast);
        }
      }
    }

    &-button {
      display: flex;
      align-items: center;
      height: 44px !important;
      width: 44px !important;
      border-radius: 44px;
      --border-width: 1px;
      --border-style: solid;
      transition: 140ms ease-in-out;
      overflow: visible !important;
      background: var(--app-white);

      @media (prefers-color-scheme: dark) {
        background: var(--app-dark-contrast);
      }


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
        --border-color: var(--app-primary-shade);
        --background: transparent;
        --color: var(--app-primary-shade);
        opacity: 0.4;

        @media (prefers-color-scheme: dark) {
          --border-color: var(--app-white);
          --color: var(--app-white);
        }

        &.selected {
          @extend %selected;
          opacity: 1;
        }
      }

      &.today {
        border-radius: 44px;
        --border-color: var(--voxxrin-event-theme-colors-primary-hex);
        --background: white;
        --background-activated: var(--app-grey-line);
        --color: var(--voxxrin-event-theme-colors-primary-hex);
        box-shadow: 0 0 0 1px rgba(var(--voxxrin-event-theme-colors-primary-rgb), 1);

        @media (prefers-color-scheme: dark) {
          --background: transparent;
          --color: white;
        }

        .todayIndicator {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translate(-50%, 0);
          height: 11px;
          width: 12px;
          border-radius: 15px;
          background: var(--app-primary);

          @media (prefers-color-scheme: dark) {
            background: var(--app-white);
          }
        }

        &.selected { @extend %selected;}
      }

      &.future {
        border-radius: 44px;
        --border-color: var(--voxxrin-event-theme-colors-primary-hex);
        --background: transparent;
        --background-activated: var(--app-grey-line);
        --color: var(--voxxrin-event-theme-colors-primary-hex);

        @media (prefers-color-scheme: dark) {
          --border-color: var(--voxxrin-event-theme-colors-primary-hex);
          --background: transparent;
          --background-activated: var(--app-dark);
          --color: rgba(white, 0.5);
          --color-activated: var(--app-white);
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
    backdrop-filter:  blur(30px) saturate(120%);

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
      padding: {
        top: 8px;
        bottom: 8px;
        left: 16px;
        right: 8px;
      }
      font-size: 34px;
      font-weight: 900;
      color: var(--voxxrin-event-theme-colors-primary-hex);

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
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
