<template>
    <ion-item @click.stop="$emit('event-clicked', event)" class="eventItem" :class="{'_is-pined' : isPinnedRef}" v-if="event"
              v-themed-event-styles="event">
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

      <div class="eventItem-config" slot="end" v-if="eventOrganizerToken">
        <ion-button fill="clear" shape="round" @click.stop="navToEventOrganizerPage()">
          <ion-icon src="/assets/icons/line/settings-cog-line.svg"></ion-icon>
        </ion-button>
      </div>

      <div class="eventItem-end" slot="end">
        <ion-button class="btnPin" fill="clear" shape="round" @click.stop="$emit('event-pin-toggled', event, isPinnedRef?'pinned-to-unpinned':'unpinned-to-pinned')">
          <ion-icon src="/assets/icons/line/pin-line.svg" v-if="!isPinnedRef"></ion-icon>
          <ion-icon class="_is-pined" src="/assets/icons/solid/pin.svg" v-if="isPinnedRef"></ion-icon>
        </ion-button>
      </div>

<!--      <div class="eventItem-dot" slot="end" @click="$emit('event-clicked', event)">-->
<!--        <span class="eventItem-dot-click">-->
<!--          <ion-icon src="/assets/icons/solid/more-menu-vertical.svg"></ion-icon>-->
<!--        </span>-->
<!--      </div>-->
    </ion-item>
</template>

<script setup lang="ts">
import {computed, PropType, toRef, unref} from "vue";
import {
    IonImg, useIonRouter,
} from '@ionic/vue';
import {EventId, ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import MonthDayDateRange from "@/components/MonthDayDateRange.vue";
import {useSharedUserTokensWallet} from "@/state/useUserTokensWallet";

const props = defineProps({
    event: {
        required: true,
        type: Object as PropType<ListableVoxxrinEvent>
    },
    pinnedEvents: {
        required: true,
        type: Object as PropType<Array<EventId>>
    },
})

defineEmits<{
    (e: 'event-clicked', event: ListableVoxxrinEvent): void,
    (e: 'event-pin-toggled', event: ListableVoxxrinEvent, transitionType: 'unpinned-to-pinned'|'pinned-to-unpinned'): void,
}>()

const ionRouter = useIonRouter();

const { organizerTokenRefForEvent } = useSharedUserTokensWallet()
const eventRef = toRef(props, 'event');
const eventIdRef = computed<EventId|undefined>(() => { const event = unref(eventRef); return event?.id; })

const isPinnedRef = computed(() => {
    if(props.pinnedEvents && props.event) {
        return !!props.pinnedEvents?.find(eventId => props.event?.id.isSameThan(eventId))
    } else {
        return false;
    }
})

const eventOrganizerToken = organizerTokenRefForEvent(eventIdRef)

function navToEventOrganizerPage() {
    ionRouter.push(`/events/${eventRef.value.id.value}/asOrganizer/${eventOrganizerToken.value}`)
}

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

  &:before {
    position: absolute;
    content: '';
    z-index: 2;
    width: 54px;
    height: 100%;
    right: 0;
    top: 0;
    background: rgba(var(--app-voxxrin-rgb), 0.25);
    transform: scale(0);
    opacity: 0;
    filter: blur(32px);
    pointer-events: none;
    transition: 140ms;
  }

  .btnPin {
    position: relative;
    transition: 140ms ease-in-out;
    transform: rotate(0deg);
    animation: reversePinedAnimation 600ms both;

    &:after {
      transition: 140ms;
      transform: rotate(0) scale(0);
      animation: reversePinedAnimationShadow 500ms both;
    }

    ion-icon {
      transition: 140ms;
      animation: reversePinedAnimationIcon 500ms both;
    }
  }

  &._is-pined {
    &:before {
      transition: 140ms;
      transform: scale(1);
      opacity: 1;
    }

    .btnPin {
      position: relative;
      animation: pinedAnimation 600ms both;

      &:after {
        position: absolute;
        left: -13px;
        bottom: -15px;
        height: 28px;
        width: 34px;
        background: url('/assets/images/png/pined-shadow.png');
        background-repeat: no-repeat;
        background-size: 100%;
        content: '';
        animation: pinedAnimationShadow 500ms both;
      }

      ion-icon {
        position: relative;
        top: 7px;
        left: -7px;
        animation: pinedAnimationIcon 500ms both;
      }
    }
  }


  // -- UnPin Animations
  @keyframes reversePinedAnimation {
    0% {
      transform: rotate(-45deg) translateY(-8px) translateX(8px);
      top: 0;
    }
    30% {
      top: -10px;
    }
    60% {
      top: -8px;
    }
    100% {
      transform: rotate(0) translateY(8px) translateX(0);
      top: -8px;
    }
  }
  @keyframes reversePinedAnimationIcon {
    0% {
      top: 7px;
      left: -7px;
    }
    30% {
      top: 0;
      left: 0;
    }
    60% {
      top: 0;
      left: 0;
    }
    100% {
      top: 0;
      left: 0;
    }
  }
  @keyframes reversePinedAnimationShadow {
    0% {
      transform: rotate(31deg) scale(1);
      opacity: 0.4;
    }
    30% {
      transform: rotate(31deg) scale(0.5);
      opacity: 0.2;
    }
    60% {
      transform: rotate(31deg) scale(0);
      opacity: 0;
    }
    100% {
      transform: rotate(31deg) scale(0);
      opacity: 0;
    }
  }

  // -- Pinned Animations
  @keyframes pinedAnimation {
    0% {
      transform: rotate(0);
    }
    30% {
      transform: rotate(-45deg) translateY(-12px) translateX(12px);
      top: -8px;
    }
    60% {
      top: -10px;
    }
    100% {
      transform: rotate(-45deg) translateY(-8px) translateX(8px);
      top: 0;
    }
  }
  @keyframes pinedAnimationIcon {
    0% {
      top: 0;
      left: 0;
    }
    30% {
      top: 0;
      left: 0;
    }
    60% {
      top: 0;
      left: 0;
    }
    100% {
      top: 7px;
      left: -7px;
    }
  }
  @keyframes pinedAnimationShadow {
    0% {
      transform: rotate(31deg)scale(0);
      opacity: 0;
    }
    30% {
      transform: rotate(31deg) scale(0);
      opacity: 0;
    }
    60% {
      transform: rotate(31deg) scale(0.5);
      opacity: 0.2;
    }
    100% {
      transform: rotate(31deg) scale(1);
      opacity: 0.4;
    }
  }

  @keyframes scale-in-center {
    0% {
      -webkit-transform: scale(0);
      transform: scale(0);
      opacity: 1;
    }
    100% {
      -webkit-transform: scale(1);
      transform: scale(1);
      opacity: 1;
    }
  }

  &-logoContainer {
    padding: 12px 12px;

    .logo {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
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
        background: radial-gradient(circle,rgba(255,255,255,0) -100%, rgba(var(--voxxrin-event-theme-colors-primary-rgb),1) 140%);
        content: '';
        z-index: -1;
      }

      ion-img {
        filter: progid:DXImageTransform.Microsoft.BasicImage(invert=1);
        zoom: 1;
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
      font-weight: 700;
      text-align: end;
      color: var(--app-grey-dark);

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
      color: var(--app-grey-dark);
      font-size: 13px;
      text-align: left;
      word-break: break-word;

      ion-icon {
        font-size: 16px;
        color: var(--app-beige-dark);
      }
    }
  }

  &-config {
    padding-inline-start: 8px;
    padding-inline-end: 12px;

    ion-button {
      height: 100% !important;
    }

    ion-icon {
      width: 34px;
      font-size: 34px;
      color: var(--app-voxxrin);
    }
  }

  &-end {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    margin-left: 12px;
    padding-inline-start: 12px;
    padding-inline-end: 12px;

    &:before {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translate(0, -50%);
      width: 1px;
      height: calc(100% - 34px);
      background: linear-gradient(180deg, rgba(var(--app-beige-line-rgb),0) 0%, rgba(var(--app-beige-line-rgb),1) 50%, rgba(var(--app-beige-line-rgb),0) 100%);
      content: '';

    }

    ion-button {
      height: 100% !important;
    }

    ion-icon {
      width: 34px;
      font-size: 34px;
      color: var(--app-grey-medium);
    }

    ._is-pined {
      color: var(--app-voxxrin) !important;
    }
  }

  &-dot {
    display: flex;
    align-items: center;
    height: 100%;
    padding-right: 20px;

    &-click  {
      position: relative;
      height: 100%;
      width: 12px;

      ion-icon {
        position: absolute;
        top: 0;
        left: -14px;
        height: 100%;
        width: 38px;
        font-size: 40px;
        color: var(--app-beige-dark);
      }
    }
  }
}
</style>
