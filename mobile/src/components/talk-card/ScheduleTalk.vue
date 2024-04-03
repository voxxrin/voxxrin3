<template>
  <div class="talkItemContainer">
    <!-- TODO Create component  -->
    <div v-if="enabledRoomStats" class="above-talkCard"
         :style="{
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
    <ion-card class="talkCard"
              v-if="talkNotes"
              :class="{ container: true, '_is-highlighted': isHighlighted(talk, talkNotes), '_has-favorited': talkNotes.isFavorite, '_has-to-watch-later': talkNotes.watchLater }"
              @click="$emit('talk-clicked', talk)">
      <div class="talkCard-head">
        <div class="start">
          <div class="item">
            <div class="track">
              <ion-badge class="trackBadge" v-if="hasTrack">
                <div class="trackBadge-content">
                  <ion-icon src="/assets/icons/solid/tag.svg"></ion-icon>{{talk.track.title}}
                </div>
              </ion-badge>
            </div>
          </div>
        </div>

        <div class="middle">
          <div class="item">
            <slot name="upper-middle" :talk="talk" :talkNotes="talkNotes" :talkStats="talkStats"></slot>
          </div>
        </div>

        <div class="end">
          <div class="item">
            <slot name="upper-right" :talk="talk" :talkNotes="talkNotes" :talkStats="talkStats"></slot>
          </div>
        </div>
      </div>

      <div class="talkCard-content">
        <div class="title"
             :class="{'_hasTalkLang' : talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1}">
          <ion-badge v-if="talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1"
                     :style="{ '--background':  talkLang.themeColor}"
                     class="talkLang">
            {{talkLang.label}}
          </ion-badge>
          {{talk.title}}
        </div>
        <div class="pictures">
          <div class="picturesItem" v-for="(speaker, index) in talk.speakers" :key="speaker.id.value">
            <ion-thumbnail>
              <img v-if="speaker.photoUrl" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)"
                   :alt="LL.Avatar_Speaker() + ' ' + speaker.fullName"/>
              <img v-if="!speaker.photoUrl" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'" aria-hidden="true" />
            </ion-thumbnail>
          </div>
        </div>
      </div>

      <div class="talkCard-footer">
        <div class="speakersContainer">
          <div class="speakers">
            <ion-icon v-if="speakerCount > 1" :icon="people"></ion-icon>
            <ion-icon v-else :icon="person"></ion-icon>
            <span class="speakers-list">{{displayedSpeakers}}</span>
          </div>
        </div>
        <div class="talkActions">
          <slot name="footer-actions" :talk="talk" :talkNotes="talkNotes" :talkStats="talkStats" />
        </div>
      </div>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, PropType} from "vue";
import {managedRef as ref, toManagedRef as toRef, useInterval} from "@/views/vue-utils";
import {
  IonBadge,
  IonThumbnail,
} from '@ionic/vue';
import { VoxxrinTalk} from "@/models/VoxxrinTalk";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {TalkNote} from "../../../../shared/feedbacks.firestore";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TalkStats} from "../../../../shared/event-stats";
import {VoxxrinRoomStats} from "@/models/VoxxrinRoomStats";
import {useCurrentClock} from "@/state/useCurrentClock";
import {Temporal} from "temporal-polyfill";
import {people, person} from "ionicons/icons";

const { LL } = typesafeI18n()
const baseUrl = import.meta.env.BASE_URL;
function handle404OnSpeakerThumbnail(img: HTMLImageElement|null) {
    if(img && img.src !== baseUrl+'assets/images/svg/avatar-shadow.svg') {
        img.src = baseUrl+'assets/images/svg/avatar-shadow.svg';
    }
}

const props = defineProps({
  talk: {
    required: true,
    type: Object as PropType<VoxxrinTalk>
  },
  isHighlighted: {
      required: true,
      type: Function as PropType<(talk: VoxxrinTalk, talkNotes: TalkNote) => boolean>
  },
  confDescriptor: {
      required: true,
      type: Object as PropType<VoxxrinConferenceDescriptor>
  },
  talkStats: {
      required: false,
      type: Object as PropType<TalkStats|undefined>
  },
  roomStats: {
      required: false,
      type: Object as PropType<VoxxrinRoomStats|undefined>
  },
  talkNotes: {
      required: false,
      type: Object as PropType<TalkNote|undefined>
  }
})

defineEmits<{
    (e: 'talk-clicked', talk: VoxxrinTalk): void,
}>()

const nowRef = ref<Temporal.ZonedDateTime|undefined>(undefined)
onMounted(async () => {
  if(props.roomStats) {
    useInterval(() => {
      nowRef.value = useCurrentClock().zonedDateTimeISO()
    }, {freq:"high-frequency"}, {immediate: true})
  }
})

const talkLang = computed(() => {
    return props.confDescriptor!.supportedTalkLanguages.find(lang => lang.id.isSameThan(props.talk!.language))
})

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));

const displayedSpeakers = props.talk!.speakers
    .map(s => `${s.fullName}${s.companyName?` (${s.companyName})`:``}`)
    .join(", ") || "???";

const speakerCount = props.talk!.speakers.length;

const hasTrack = (props.confDescriptor?.talkTracks.length || 0) > 1;

const enabledRoomStats = computed(() => {
  const talkRoomId = props.talk?.room.id;
  const talkId = props.talk?.id;
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

const theme = {
  track: {
    color: props.talk!.track.themeColor
  }
}
</script>

<style lang="scss" scoped>

.talkItemContainer {
  display: flex;
  flex-direction: column;
  min-width: 100%;
}

.above-talkCard {
  position: relative;
  display: flex;
  width: calc(100% - 32px);
  column-gap: 12px;
  margin :{
    left: 16px;
    right: 16px;
    bottom: -12px;
    top: 12px;
  };
  flex-direction: row;
  align-items: center;
  padding: 4px 8px 8px 12px;
  border-radius: 12px 12px 0 0;
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
    .above-talkCard-bg { background: url('assets/images/jpg/room-capacity-3.jpg');}
  }
  &.level2 {
    .level2-segment, .level1-segment {
      fill: var(--app-yellow);
      fill-opacity: 1;
    }
    .above-talkCard-bg { background: url('assets/images/jpg/room-capacity-2.jpg');}
  }
  &.level1 {
    .level1-segment {
      fill: var(--app-green);
      fill-opacity: 1;
    }
    .above-talkCard-bg { background: url('assets/images/jpg/room-capacity-1.jpg');}
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

//* Base styles card talk *//
.talkCard {
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  flex: 1;
  margin: 8px;
  border-left: 6px solid v-bind('theme.track.color');
  border-radius: var(--app-card-radius);
  border : {
    top: 1px solid var(--app-grey-line);
    right: 1px solid var(--app-grey-line);
  }
  box-shadow: rgba(100, 100, 111, 0.2) 0 7px 29px 0;
  transition: 80ms ease-in-out;

  @media (prefers-color-scheme: dark) {
    background: var(--app-light-contrast);
    border : {
      top: 1px solid var(--app-line-contrast);
      right: 1px solid var(--app-line-contrast);
    }
  }

  &:active {
    transition: 80ms ease-in-out;
    transform: scale(0.99);
    box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
  }

  &:before, &:after {
    position: absolute;
    content: '';
    z-index: -1;
  }

  &-head {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 0px 0px;

    //display: flex;
    //justify-content: space-between;

    .item {
      display: flex;
    }
    .start {
      grid-area: 1 / 1 / 2 / 4;
      .item { flex-direction: row; }
      padding-top: 8px;
    }
    .end {
      grid-area: 1 / 4 / 2 / 7;
      .item { flex-direction: row-reverse; }
      padding-top: 8px;
    }
    .middle {
      grid-area: 1 / 3 / 2 / 5;
      .item { justify-content: center; }
    }

    padding: 0 12px 0 8px;

    @mixin background-opacity($color, $opacity: 0.3) {
      background: $color; /* The Fallback */
      background: rgba($color, $opacity);
    }

    .trackBadge {
      --background: v-bind('theme.track.color');

      @media (prefers-color-scheme: dark) {
        --color: var(--app-white);
      }
    }
  }

  &-content {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    padding: 0 12px 0 8px;

    .title {
      flex: 1 1 0;
      font-weight: bolder;
      color: var(--app-primary);
      font-size: 16px;
      line-height: 1.2;

      &._hasTalkLang { text-indent: 4px;}

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }

      .talkLang {
        float: left;
        font-size: 12px;
        height: 19px;
        width: 28px !important;
        text-indent: 0;
      }
    }

    .pictures {
      display: flex;
      flex-direction: row;
      flex: 0 0 auto;

      .picturesItem {
        width: 24px;

        &:last-child {
          margin-right: 24px;
        }

        ion-thumbnail {
          --size: 48px;
          --border-radius: 40px;
          filter: drop-shadow(-4px 0px 4px rgba(0, 0, 0, 0.15));
          background-color: var(--app-background);

          @media (prefers-color-scheme: dark) {
            background-color: var(--app-medium-contrast);
          }
        }
      }
    }
  }

  &-footer {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    border-radius: 0 0 12px 0;
    border : {
      top: 1px solid var(--app-grey-line);
      bottom: 1px solid var(--app-grey-line);
    }
    background-color: rgba(white, 0.6);

    @media (prefers-color-scheme: dark) {
      background-color: rgba(white, 0.05);
      border : {
        top: 1px solid var(--app-line-contrast);
        bottom: 1px solid var(--app-line-contrast);
      }
    }

    .speakersContainer {
      display: flex;
      align-items: center;
      column-gap: 4px;
      padding: 8px;
      font-size: 12px;
      line-height: 1.1;
      letter-spacing: -0.4px;
      color: var(--app-primary);
      font-weight: 500;

      @media (prefers-color-scheme: dark) {
        color: var(--app-white-70);

      }

      .speakers {
        display: flex;
        align-items: start;
        gap: 4px;
      }

      &-list {
        flex: 1;
      }

      ion-icon {
        position: relative;
        top: -2px;
        flex: 0 0 auto;
        max-width: 24px;
        font-size: 16px;
      }
    }
  }

  //* States card talk *//

  &._is-highlighted {
    border : {
      top: 2px solid var(--app-primary);
      bottom: 2px solid var(--app-primary);
      right: 2px solid var(--app-primary);
    }

    @media (prefers-color-scheme: dark) {
      border : {
        top: 2px solid var(--app-white) !important;
        bottom: 2px solid var(--app-white) !important;
        right: 2px solid var(--app-white) !important;
      }
    }

    ion-thumbnail {
      background-color: var(--app-background);
      border: 2px solid var(--app-primary);

      @media (prefers-color-scheme: dark) {
        border: 2px solid var(--app-white) !important;
      }
    }

    .talkCard-footer {
      border-width: 2px;
      border-color: var(--app-primary);
      border-bottom: none;

      @media (prefers-color-scheme: dark) {
        border-color: var(--app-white) !important;
      }

      :deep(.linearRating) {
        border-width: 2px;
        border-color: var(--app-primary);
      }


      /* TODO RLZ: move it to a proper place in talk actions components */
      :deep(.btnTalk) {
        border-width: 2px;
        border-color: var(--app-primary);

        @media (prefers-color-scheme: dark) {
          border-color: var(--app-white) !important;
        }
      }
    }

    //* Add paint stain style when card favorited or Pin Feedback *//
    &._has-favorited {
      border : {
        top: 2px solid var(--app-primary-shade);
        bottom: 2px solid var(--app-primary-shade);
        right: 2px solid var(--app-primary-shade);
      }

      @media (prefers-color-scheme: dark) {
        --border : {
          top: 2px solid var(--app-white);
          bottom: 2px solid var(--app-white);
          right: 2px solid var(--app-white);
        }
      }

      &:before { background: rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6);}

      ion-thumbnail { border: 2px solid var(--app-primary-shade);}

      .talkCard-footer {
        border-color: var(--app-primary-shade);

        /* TODO RLZ: move it to a proper place in talk actions components */
        :deep(.btnTalk) { border-color: var(--app-primary-shade);}
      }
    }

    //* TODO - Start - Delete when btn is component *//
    //* Change style type actions *//
    ion-button {
      &.btn-watchLater {
        --background: var(--voxxrin-event-theme-colors-secondary-hex);
        --color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);
        border-left: 1px solid var(--voxxrin-event-theme-colors-secondary-hex);
      }

      &.btn-feedbackSelect {
        --background: var(--voxxrin-event-theme-colors-primary-hex);
        --color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
        border-left: 1px solid var(--voxxrin-event-theme-colors-primary-hex);
      }
      //* END - Delete when btn is component *//
    }
  }

  &._has-favorited {
    &:before {
      width: 40%;
      height: 70%;
      right: 0;
      bottom: 0;
      transform: scale(1);
      background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6) 30%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6) 80%);
      opacity: 1;
      filter: blur(32px);
      animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
    }

    &:after {
      width: 50%;
      height: 100%;
      right: 0;
      bottom: 0;
      background-image: url('/assets/images/png/texture-favorited.png');
      background-repeat: no-repeat;
      background-position: right;
      background-size: cover;
      transform: scale(1);
      opacity: 0.5;
      mix-blend-mode: overlay;
      animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;

      @media (prefers-color-scheme: dark) {
        mix-blend-mode: difference;
      }
    }

    &._has-to-watch-later {
      &:before {
        background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-secondary-rgb), 0.6) 30%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6) 80%) !important;
      }
    }
  }

  .talkActions {
    display: flex;
    flex-direction: row;

    :deep(.talkAction) {
      height: 100%;
    }
  }
}
</style>
