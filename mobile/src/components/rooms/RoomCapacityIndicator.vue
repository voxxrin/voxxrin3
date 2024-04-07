<template>
  <transition enter-active-class="_enterBanner" leave-active-class="_leaverBanner">
  <div v-if="!!confDescriptorRef?.features.showRoomCapacityIndicator && capacityStatusRef && roomCapacityIndicatorShownRef"
       class="above-talkCard"
       :style="{
          '--status-level1-color': '#73a027',
          '--status-level2-color': '#ff6a00',
          '--status-level3-color': '#cc0f0f',
          '--status-full-color': '#cc0f0f',
          '--status-unknown-color': 'transparent',
          '--border-radius': bottomRounded ? '12px 12px 12px 12px' : '12px 12px 0px 0px',
          '--room-stats-lightColor': `var(--status-${capacityStatusRef.id}-color)`,
       }"
       :class="`status-${capacityStatusRef.id}`">
    <ion-alert
        :is-open="indicatorExplanationPopupOpened"
        @didDismiss="setIndicatorExplanationPopupOpened(false)"
        :header="LL.How_is_room_capacity_indicator_calculated()"
        :buttons="[{ text: 'Close', handler: () => setIndicatorExplanationPopupOpened(false) }]"
        :cssClass="'indicator-alert'"
        :message="`
        ${LL.Organizers_are_regularly_sending_room_capacity_ratio()}:
      <ul class='roomCapacityLegend'>
        <li>
           <ion-icon src='./assets/images/svg/room-gauge-indicator-1.svg' aria-hidden='true'></ion-icon>
            <div><span class='range level1'>${LEVELS.level1.rangeLabel}</span> ${LL.Still_plenty_of_seats_available()}</div>
        </li>
        <li>
          <ion-icon src='/assets/images/svg/room-gauge-indicator-2.svg' aria-hidden='true'></ion-icon>
           <div><span class='range level2'>${LEVELS.level2.rangeLabel}</span> ${LL.Room_is_becoming_crowded()}</li></div>
        <li>
          <ion-icon src='./assets/images/svg/room-gauge-indicator-3.svg' aria-hidden='true'></ion-icon>
           <div><span class='range level3'>${LEVELS.level3.rangeLabel}</span> ${LL.Only_few_seats_left()}</li></div>
        <li>
          <ion-icon class='full-indicator-legend' src='./assets/images/svg/room-gauge-indicator-full.svg' aria-hidden='true'></ion-icon>
          <div><span class='range full'>${LEVELS.full.rangeLabel}</span> ${LL.No_seats_available()}</div>
        </li>
      </ul>`"
    ></ion-alert>
    <span class="above-talkCard-state">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 40 40">
              <path class="level1-segment" d="m12.33,26.89h-6.37c.68,1.8,1.62,3.49,2.8,5.04,1.88,2.46,4.32,4.47,7.13,5.87,2.81,1.4,5.91,2.15,9.06,2.2h.15c-8.01-2.92-11.87-7.99-12.77-13.11Z"/>
              <path class="level2-segment" d="m17.47,13.43l-6.86-7.44c-.2.2-.4.39-.58.59-2.12,2.28-3.66,4.99-4.53,7.94-.62,2.11-.86,4.3-.75,6.47h7.82c.77-3,2.5-5.69,4.91-7.57Z"/>
              <path class="level3-segment" d="m26.93.07c-3.14-.25-6.3.21-9.23,1.34-.8.31-1.57.67-2.32,1.06l7.78,8.44c3.71-.64,8.09.3,12.66,3.62V2.84C33.11,1.26,30.07.31,26.93.07Z"/>
        </svg>
        <ion-icon class="indicator full" :icon="sad" aria-hidden="true"></ion-icon>
        <ion-icon class="indicator unknown" :icon="helpCircleOutline" aria-hidden="true"></ion-icon>
      </span>
    <div class="above-talkCard-txt">
      <span :style="{
        fontStyle: capacityStatusRef.id === 'unknown' ? 'italic':'normal'
      }">{{capacityStatusRef.label}}</span>
      <span v-if="sinceLabelRef.shown" class="since">{{sinceLabelRef.label}}</span>
    </div>
    <ion-button v-if="capacityStatusRef.id !== 'unknown'" :aria-label="LL.Infos()" class="above-talkCard-info" @click="setIndicatorExplanationPopupOpened(true)">
      <ion-icon :src="'/assets/icons/line/info-circle-line.svg'"></ion-icon>
    </ion-button>
    <span class="above-talkCard-bg"></span>
  </div>
  </transition>
</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {computed, PropType, toRef, toValue} from "vue";
import {IonAlert, IonIcon} from "@ionic/vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {VoxxrinRoomStats, VoxxrinUnknownRoomStats} from "@/models/VoxxrinRoomStats";
import {managedRef as ref, useInterval} from "@/views/vue-utils";
import {watchClock} from "@/state/useCurrentClock";
import {sad, helpCircleOutline} from "ionicons/icons";
import {match, P} from "ts-pattern";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {EventId} from "@/models/VoxxrinEvent";
import {Temporal} from "temporal-polyfill";

const { LL } = typesafeI18n()

const LEVELS = {
  unknown: { id: 'unknown', rangeLabel: `Unknown`, label: LL.value.Unknown_room_capacity() },
  level1: { id: 'level1', upperBoundExcluded: 0.60, rangeLabel: `&lt; 60%`, label: LL.value.Still_plenty_of_seats_available() },
  level2: { id: 'level2', upperBoundExcluded: 0.80, rangeLabel: `60% -&gt; 80%`, label: LL.value.Room_is_becoming_crowded() },
  level3: { id: 'level3', upperBoundExcluded: 0.99, rangeLabel: `80% -&gt; 99% `, label: LL.value.Only_few_seats_left() },
  full: { id: 'full', upperBoundIncluded: 1, rangeLabel: `&gt;= 99%`, label: LL.value.No_seats_available() },
} as const;

const props = defineProps({
  eventId: {
    required: true,
    type: Object as PropType<EventId>
  },
  talk: {
    required: true,
    type: Object as PropType<VoxxrinTalk>
  },
  showUnknownCapacity: {
    required: false,
    type: Boolean,
    default: undefined
  },
  roomStats: {
    required: false,
    type: Object as PropType<VoxxrinRoomStats|undefined>
  },
  bottomRounded: {
    required: false,
    type: Boolean
  }
})

// Updating clockRef only if some roomStats have been made available
const clockRef = watchClock({freq: 'high-frequency'}, () => null, () => !!props.roomStats);

const capacityStatusRef = computed(() => {
  const maybeRoomStats = props.roomStats,
    now = toValue(clockRef)

  if(!maybeRoomStats) {
    return undefined;
  }

  const unknownRoomStats: VoxxrinUnknownRoomStats = {
    ...maybeRoomStats,
    capacityFillingRatio: "unknown",
  }
  const unknownCapacityStatus = { ...unknownRoomStats, ...LEVELS.unknown } as const;

  if(!now || maybeRoomStats.capacityFillingRatio === 'unknown'
    || Date.parse(maybeRoomStats.valid.until) < now.epochMilliseconds
  ) {

    return unknownCapacityStatus;
  }

  const capacityStatus = match(maybeRoomStats)
    .with({ capacityFillingRatio: P.number.lt(LEVELS.level1.upperBoundExcluded) }, (roomStats) => ({ ...roomStats, ...LEVELS.level1 } as const))
    .with({ capacityFillingRatio: P.number.lt(LEVELS.level2.upperBoundExcluded) }, (roomStats) => ({ ...roomStats, ...LEVELS.level2 } as const))
    .with({ capacityFillingRatio: P.number.lt(LEVELS.level3.upperBoundExcluded) }, (roomStats) => ({ ...roomStats, ...LEVELS.level3 } as const))
    .with({ capacityFillingRatio: P.number.lte(LEVELS.full.upperBoundIncluded) }, (roomStats) => ({ ...roomStats, ...LEVELS.full } as const))
    .otherwise((roomStats) => unknownCapacityStatus);

  return capacityStatus;
})

const sinceLabelRef = computed(() => {
  const capacityStatus = toValue(capacityStatusRef),
     now = toValue(clockRef)

  if(!capacityStatus || !now || capacityStatus.id === 'unknown') {
    return { shown: false } as const;
  }

  const sinceMinutes = Math.max(Math.round(now.toInstant().since(capacityStatus.persistedAt).total('minutes')), 0)

  return {
    shown: true,
    label: sinceMinutes === 0
      ? LL.value.few_seconds_ago()
      : LL.value.xx_minutes_ago({minutes: sinceMinutes})
  } as const;
})

const { conferenceDescriptor: confDescriptorRef } = useSharedConferenceDescriptor(toRef(() => props.eventId))
const roomCapacityIndicatorShownRef = computed(() => {
  const capacityStatus = toValue(capacityStatusRef),
    showUnknownCapacity = toValue(() => props.showUnknownCapacity),
    confDescriptor = toValue(confDescriptorRef),
    now = toValue(clockRef),
    roomStats = props.roomStats,
    talkRoomId = props.talk.room.id,
    talkId = props.talk.id;

  if(!capacityStatus || !confDescriptor || !now || !roomStats
    || !roomStats.roomId.isSameThan(talkRoomId)
  ) {
    return false;
  }

  if(Temporal.ZonedDateTime.compare(confDescriptor.start, now) !== -1) {
    // No need to show indicator before the conference starts
    return false;
  }

  return match(capacityStatus)
      .with({ capacityFillingRatio: 'unknown' }, (unknownCapacityStatus) => showUnknownCapacity)
      .otherwise(knownCapacityStatus =>
        knownCapacityStatus.valid.forTalkId.isSameThan(talkId)
        // && now.epochMilliseconds <= Date.parse(knownCapacityStatus.valid.until)
      )
})

const indicatorExplanationPopupOpened = ref(false);
function setIndicatorExplanationPopupOpened(opened: boolean) {
  indicatorExplanationPopupOpened.value = opened;
}
</script>

<style lang="scss" >
.indicator-alert {
  .alert-wrapper {
    max-width: 450px;
    text-align: left;

    .alert-title {
      text-align: left;
    }

    .alert-message {
      max-height: inherit;
      padding-top: 16px;
      padding-bottom: 0;
      text-align: left;

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }
  }

  .roomCapacityLegend {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0;
    list-style: none;
    font-size: 12px;

    li {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;

      ion-icon {
        font-size: 24px;
      }
    }

    .range {
      display: block;
      font-weight: 900;

      &.level1 { color: #73a027}
      &.level2 {color: #ff6a00}
      &.level3 { color: #cc0f0f}
      &.full {
        color: var(--app-black);

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }
    }
  }
}

.above-talkCard {
  position: relative;
  display: flex;
  width: calc(100% - 32px);
  column-gap: 12px;
  margin: {
    left: 16px;
    right: 16px;
    bottom: -12px;
    top: 12px;
  };
  flex-direction: row;
  align-items: center;
  padding: 4px 8px 8px 12px;
  border-radius: var(--border-radius);
  background: var(--app-primary);
  overflow: hidden;
  transition: margin-bottom 340ms ease-in-out;
  animation-duration: 340ms;
  animation-fill-mode: both;
  z-index: 0;

  &._enterBanner { animation: slideInRoomCapacityBanner 340ms ease-in-out both;}
  &._leaverBanner { animation: slideInRoomCapacityBanner 340ms reverse both;}

  @keyframes slideInRoomCapacityBanner {
    0% {margin-bottom: -64px;}
    100% {margin-bottom: -12px;}
  }

  @media (prefers-color-scheme: dark) {
    border: 1px solid var(--app-line-contrast);
  }

  &:before {
    position: absolute;
    bottom: -40px;
    right: 0;
    height: 40px;
    width: 60%;
    max-width: 620px;
    border-radius: 100%;
    content: "";
    box-shadow: 0 -8px 24px 4px var(--room-stats-lightColor);
    pointer-events: none;
    z-index: 1;
  }

  &:after {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 134px);
    content: "";
    pointer-events: none;
    z-index: 0;

    @media (prefers-color-scheme: dark) {
      background: linear-gradient(270deg, rgba(0,0,0,0) 0%, var(--app-dark-contrast) 134px);
    }
  }


  &.status-unknown {
    background: rgba(var(--app-primary-rgb), 0.15);
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);

    ion-icon {
      color: var(--app-primary);
    }
    .above-talkCard-txt {
      color: var(--app-primary);
    }

    &:after {
      display: none;
    }
  }
  &.status-full, &.status-unknown {
    svg {
      display: none;
    }
  }
  &.status-full .full.indicator, &.status-unknown .unknown.indicator {
    display: block;
  }
  &.status-level3 {
    .level3-segment, .level2-segment, .level1-segment {
      fill: var(--app-red);
      fill-opacity: 1;
    }
    .above-talkCard-bg { background: url('/assets/images/jpg/room-capacity-3.jpg');}
  }
  &.status-level2 {
    .level2-segment, .level1-segment {
      fill: var(--app-yellow);
      fill-opacity: 1;
    }
    .above-talkCard-bg { background: url('/assets/images/jpg/room-capacity-2.jpg');}
  }
  &.status-level1 {
    .level1-segment {
      fill: var(--app-green);
      fill-opacity: 1;
    }
    .above-talkCard-bg { background: url('/assets/images/jpg/room-capacity-1.jpg');}
  }

  &-state {
    position: relative;
    display: flex;
    z-index: 1;

    .indicator {
      display: none;
      color: var(--app-white);
      font-size: 28px;
    }

    svg {
      width: 28px;

      path {
        fill: var(--app-white);
        fill-opacity: 0.3;
      }
    }
  }

  &-txt {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--app-white);
    font-weight: 700;
    font-size: 14px;
    z-index: 2;

    .since {
      font-size: 11px;
      font-weight: normal;
    }
  }

  &-info {
    position: relative;
    height: 34px;
    width: 34px;
    --padding-start: 0;
    --padding-end: 0;
    --background: transparent;
    --box-shadow: none;
    z-index: 1;

    @media (prefers-color-scheme: dark) {
      --background: transparent !important;
      --color: var(--app-white) !important;
    }

    ion-icon {
      font-size: 28px;
    }
  }

  &-bg {
    position: absolute;
    right: 0;
    top: 50%;
    width: 164px;
    height: 100%;
    transform: translate(0, -50%);
    background-size: 100% !important;
    background-repeat: no-repeat !important;
  }
}
</style>
