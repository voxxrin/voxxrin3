<template>
    <div v-if="enabledRoomStats" class="above-talkCard"
         :style="{
          '--border-radius': bottomRounded ? '12px 12px 12px 12px' : '12px 12px 0px 0px',
          '--room-stats-lightColor':
            enabledRoomStats.capacityFillingRatio < 0.60 ? '#73a027'
            : enabledRoomStats.capacityFillingRatio < 0.80 ? '#ff6a00'
            : enabledRoomStats.capacityFillingRatio < 0.99 ? '#cc0f0f' : 'black',
       }"  :class="{ 'level1': enabledRoomStats.capacityFillingRatio < 0.60,
                'level2':enabledRoomStats.capacityFillingRatio >= 0.60 && enabledRoomStats.capacityFillingRatio < 0.80,
                'level3': enabledRoomStats.capacityFillingRatio >= 0.80 && enabledRoomStats.capacityFillingRatio < 0.99}">
      <span class="above-talkCard-state">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 40 40">
              <path class="level1-segment" d="m12.33,26.89h-6.37c.68,1.8,1.62,3.49,2.8,5.04,1.88,2.46,4.32,4.47,7.13,5.87,2.81,1.4,5.91,2.15,9.06,2.2h.15c-8.01-2.92-11.87-7.99-12.77-13.11Z"/>
              <path class="level2-segment" d="m17.47,13.43l-6.86-7.44c-.2.2-.4.39-.58.59-2.12,2.28-3.66,4.99-4.53,7.94-.62,2.11-.86,4.3-.75,6.47h7.82c.77-3,2.5-5.69,4.91-7.57Z"/>
              <path class="level3-segment" d="m26.93.07c-3.14-.25-6.3.21-9.23,1.34-.8.31-1.57.67-2.32,1.06l7.78,8.44c3.71-.64,8.09.3,12.66,3.62V2.84C33.11,1.26,30.07.31,26.93.07Z"/>
        </svg>
      </span>
      <div class="above-talkCard-txt">
        <span v-if="enabledRoomStats.capacityFillingRatio < 0.60">{{ LL.Still_plenty_of_seats_available() }}</span>
        <span v-if="enabledRoomStats.capacityFillingRatio >= 0.60 && enabledRoomStats.capacityFillingRatio < 0.80">{{ LL.Room_is_becoming_crowded() }}</span>
        <span v-if="enabledRoomStats.capacityFillingRatio >= 0.80 && enabledRoomStats.capacityFillingRatio < 0.99">{{ LL.Only_few_seats_left() }}</span>
        <span v-if="enabledRoomStats.capacityFillingRatio >= 0.99">{{ LL.No_seats_available() }}</span>
        <span class="since" v-if="enabledRoomStats.since === 0">{{LL.few_seconds_ago()}}</span>
        <span class="since" v-if="enabledRoomStats.since !== 0">{{LL.xx_minutes_ago({ minutes: enabledRoomStats.since })}}</span>
      </div>
      <!-- TODO Add click for appear tooltips popin info context -->
      <ion-button aria-label="Infos" class="above-talkCard-info">
        <ion-icon :src="'/assets/icons/line/info-circle-line.svg'"></ion-icon>
      </ion-button>
      <span class="above-talkCard-bg"></span>
    </div>
</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {computed, onMounted, PropType} from "vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {VoxxrinRoomStats} from "@/models/VoxxrinRoomStats";
import {managedRef as ref, useInterval} from "@/views/vue-utils";
import {Temporal} from "temporal-polyfill";
import {useCurrentClock} from "@/state/useCurrentClock";

const { LL } = typesafeI18n()

const props = defineProps({
  talk: {
    required: true,
    type: Object as PropType<VoxxrinTalk>
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

const nowRef = ref<Temporal.ZonedDateTime|undefined>(undefined)
useInterval(() => {
  if(props.roomStats) {
    nowRef.value = useCurrentClock().zonedDateTimeISO()
    }
}, {freq:"high-frequency"}, {immediate: true})


const enabledRoomStats = computed(() => {
  const talkRoomId = props.talk.room.id;
  const talkId = props.talk.id;
  const roomStats = props.roomStats;
  const now = nowRef.value

  if(roomStats && now
    && roomStats.capacityFillingRatio !== 'unknown'
    && roomStats.roomId.isSameThan(talkRoomId)
    && roomStats.valid.forTalkId.isSameThan(talkId)
    && Date.parse(roomStats.valid.until) >= now.epochMilliseconds
  ){
    return {
      ...roomStats,
      since: Math.max(Math.round(now.toInstant().since(roomStats.persistedAt).total('minutes')), 0)
    };
  } else {
    return undefined;
  }
})

</script>

<style lang="scss" scoped>
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
  z-index: 0;


  &:before {
    position: absolute;
    bottom: -38px;
    right: 0;
    /* transform: translate(-50%, 0); */
    height: 40px;
    width: 60%;
    border-radius: 100%;
    content: "";
    box-shadow: 0px -4px 24px 4px var(--room-stats-lightColor);
    pointer-events: none;
    z-index: 1;
  }

  &:after {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 194px);
    content: "";
    pointer-events: none;
    z-index: 0;
  }

  &.level3 {
    .level3-segment, .level2-segment, .level1-segment {
      fill: var(--app-red);
      fill-opacity: 1;
    }
    .above-talkCard-bg { background: url('/assets/images/jpg/room-capacity-3.jpg');}
  }
  &.level2 {
    .level2-segment, .level1-segment {
      fill: var(--app-yellow);
      fill-opacity: 1;
    }
    .above-talkCard-bg { background: url('/assets/images/jpg/room-capacity-2.jpg');}
  }
  &.level1 {
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
