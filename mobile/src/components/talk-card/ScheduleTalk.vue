<template>
  <div class="talkItemContainer">
    <room-capacity-indicator v-if="!!roomStats" :event-id="eventId" :talk="talk" :room-stats="roomStats" :show-unknown-capacity="isUpcomingTalk" />
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
            <speaker-thumbnail size="48px" :is-highlighted="isHighlighted(talk, talkNotes) || talkNotes.isFavorite" :speaker="speaker" />
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
import {people, person} from "ionicons/icons";
import RoomCapacityIndicator from "@/components/rooms/RoomCapacityIndicator.vue";
import SpeakerThumbnail from "@/components/speaker/SpeakerThumbnail.vue";

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
  isUpcomingTalk: {
      required: false,
      type: Boolean,
      default: undefined
  },
  talkNotes: {
      required: false,
      type: Object as PropType<TalkNote|undefined>
  }
})

defineEmits<{
    (e: 'talk-clicked', talk: VoxxrinTalk): void,
}>()

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
        --background: var(--voxxrin-event-theme-colors-tertiary-hex);
        --color: var(--voxxrin-event-theme-colors-tertiary-contrast-hex);
        border-left: 1px solid var(--voxxrin-event-theme-colors-tertiary-hex);
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
        background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-tertiary-rgb), 0.6) 30%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6) 80%) !important;
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
