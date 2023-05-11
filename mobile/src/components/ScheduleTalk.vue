<template>
  <ion-card class="talkCard" :class="{ container: true, 'is-favorited': favoritedRef, 'to-watch-later': watchLaterRef }" >
    <div class="talkCard-head">
      <div class="track">
        <ion-badge class="trackBadge">
          <ion-icon src="/assets/icons/solid/tag.svg"></ion-icon>{{talk.track.title}}
        </ion-badge>
      </div>

      <div class="room">
        <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
        {{talk.room.title}}
      </div>
    </div>

    <div class="talkCard-content">
      <div class="title">{{talk.title}}</div>
      <div class="pictures">
        <div class="picturesItem" v-for="(speaker, index) in talk.speakers" :key="index">
          <ion-thumbnail>
            <img :src="speaker.photoUrl" />
          </ion-thumbnail>
        </div>
      </div>
    </div>

    <div class="talkCard-footer">
      <div class="speakers">
        <ion-icon src="/assets/icons/solid/megaphone.svg"></ion-icon>
        <span class="speakers-list">{{displayedSpeakers}}</span>
      </div>
      <div class="talkCard-footer-actions">
        <div class="watchLater">
          <ion-button class="btnTalk watch-later-btn" @click="() => toggleWatchLater()">
            <ion-icon v-if="!watchLaterRef" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
            <ion-icon v-if="watchLaterRef" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
          </ion-button>
        </div>
        <div class="favorite">
          <ion-button class="btnTalk favorite-btn" @click="() => toggleFavorited()">
            <ion-icon class="favorite-btn-icon" v-if="!favoritedRef" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
            <ion-icon class="favorite-btn-icon" v-if="favoritedRef" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
            <ion-label class="favorite-btn-nb" v-if="favoritesCount">{{ favoritesCount }}</ion-label>
          </ion-button>
        </div>
      </div>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {
  IonBadge,
  IonThumbnail,
} from '@ionic/vue';
import { VoxxrinTalk} from "@/models/VoxxrinTalk";


const props = defineProps({
  talk: {
    required: true,
    type: Object as PropType<VoxxrinTalk>
  },
  favorited: {
    required: true,
    type: Boolean
  },
  toWatchLater: {
    required: true,
    type: Boolean
  },
  favoritesCount: {
    required: false,
    type: Number
  }
})

const favoritedRef = ref(props.favorited!);
const watchLaterRef = ref(props.toWatchLater!);

const displayedSpeakers = props.talk!.speakers
    .map(s => `${s.fullName}${s.companyName?` (${s.companyName})`:``}`)
    .join(", ");

const theme = {
  track: {
    color: props.talk!.track.themeColor
  }
}

function toggleFavorited() {
    favoritedRef.value = !favoritedRef.value;
}
function toggleWatchLater() {
    watchLaterRef.value = !watchLaterRef.value;
}
</script>

<style lang="scss" scoped>

.talkCard {
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  width: 100%;
  border-left: 6px solid v-bind('theme.track.color');
  border-radius: 8px 12px 12px 8px;
  border : {
    top: 1px solid var(--app-grey-line);
    right: 1px solid var(--app-grey-line);
  }
  box-shadow: rgba(100, 100, 111, 0.2) 0 7px 29px 0;
  transition: 80ms ease-in-out;

  @media (prefers-color-scheme: dark) {
    background: var(--app-dark-contrast);
    border : {
      top: 1px solid var(--app-light-contrast);
      right: 1px solid var(--app-light-contrast);
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

  &.is-favorited  {
    border-top: 2px solid var(--app-primary-shade);
    border-bottom: 2px solid var(--app-primary-shade);
    border-right: 2px solid var(--app-primary-shade);

    @media (prefers-color-scheme: dark) {
      border-top: 2px solid var(--app-white);
      border-bottom: 2px solid var(--app-white);
      border-right: 2px solid var(--app-white);
    }

    &:before {
      width: 40%;
      height: 70%;
      right: 0;
      bottom: 0;
      background: rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6);
      transform: scale(1);
      opacity: 1;
      filter: blur(32px);
      animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
    }

    &:after {
      width: 50%;
      height: 100%;
      right: 0;
      bottom: 0;
      background-image: url('assets/images/png/texture-favorited.png');
      transform: scale(1);
      opacity: 0.5;
      mix-blend-mode: overlay;
      animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;

      @media (prefers-color-scheme: dark) {
        mix-blend-mode: difference;
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

    ion-thumbnail {
      background-color: var(--app-background);
      border: 2px solid var(--app-primary-shade);
    }

    ion-button.favorite-btn {
      --background: var(--voxxrin-event-theme-colors-primary-hex);
      --color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
      border-left: 1px solid var(--app-primary-shade);
      --border-radius:  0 0 8px 0 !important;
    }

    .talkCard-footer {
      border-width: 2px;
      border-color: var(--app-primary-shade);
      border-bottom: none;

      @media (prefers-color-scheme: dark) {
        border-color: var(--app-white);
      }

      .btnTalk {
        border-width: 2px;
        border-color: var(--app-primary-shade);
      }
    }
  }

  &.to-watch-later {
    ion-button.watch-later-btn {
      --background: var(--voxxrin-event-theme-colors-secondary-hex);
      --color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);
      border-left: 1px solid var(--voxxrin-event-theme-colors-secondary-hex);
    }
  }

  &-head {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    padding: 8px 12px 0 8px;

    @mixin background-opacity($color, $opacity: 0.3) {
      background: $color; /* The Fallback */
      background: rgba($color, $opacity);
    }

    .trackBadge {
      --background: v-bind('theme.track.color');
      --color: v-bind('theme.track.color');

      @media (prefers-color-scheme: dark) {
        --color: var(--app-white);
      }
    }

    .room {
      display: flex;
      align-items: center;
      column-gap: 2px;
      font-weight: 500;
      color: var(--app-grey-dark);

      @media (prefers-color-scheme: dark) {
        color: rgba(white, 0.8);
      }

      ion-icon {
        font-size: 16px;
        color: var(--app-primary-shade);

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
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

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
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

        }
      }
    }
  }

  &-footer {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    border : {
      top: 1px solid var(--app-grey-line);
      bottom: 1px solid var(--app-grey-line);
    }

    @media (prefers-color-scheme: dark) {
      border : {
        top: 1px solid var(--app-light-contrast);
        bottom: 1px solid var(--app-light-contrast);
      }
    }

    .speakers {
      display: flex;
      align-items: center;
      column-gap: 4px;
      padding: 8px;
      font-size: 11px;
      line-height: 1.1;
      letter-spacing: -0.4px;
      color: v-bind('theme.track.color');

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }

      &-list {
        flex: 1;
      }

      ion-icon {
        max-width: 24px;
        font-size: 16px;
        transform: rotate(-16deg);
      }
    }

    .btnTalk {
      height: 100%;
      min-height: 48px;
      width: 58px;
      margin: 0;
      --border-radius: 0;
      --background: white;
      --color: var(--app-primary);
      border-left: 1px solid var(--app-grey-line);
      font-size: 18px;
      --padding-start: 0;
      --padding-end: 0;
      --background-activated-opacity: 0.1;
      --background-hover-opacity: 0.1;

      @media (prefers-color-scheme: dark) {
        --background: var(--app-dark-contrast);
        --color: var(--app-white);
        border-left: 1px solid var(--app-light-contrast);
      }

      .favorite-btn {
        --size: 28px;

        &-icon {
          position: relative;
          top: -6px;
          font-size: 26px;
        }

        &-nb {
          position: absolute;
          bottom: 5px;
          font-size: 11px;
          font-weight: 700;
        }
      }
    }

    &-actions {
      display: flex;
    }
  }
}
</style>
