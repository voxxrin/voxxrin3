<template>
  <ion-card class="talkCard"
            v-if="talkNotes"
            :class="{ container: true, '_is-highlighted': isHighlighted(talk, talkNotes), '_has-favorited': talkNotes.isFavorite, '_has-to-watch-later': talkNotes.watchLater }"
            @click="$emit('talk-clicked', talk)">
    <div class="talkCard-head">
      <div class="start">
        <div class="item">
          <div class="track">
            <ion-badge class="trackBadge" v-if="hasTrack">
              <ion-icon src="/assets/icons/solid/tag.svg"></ion-icon>{{talk.track.title}}
            </ion-badge>
          </div>
        </div>
      </div>

      <div class="middle">
        <div class="item">
          <slot name="upper-middle" :talk="talk" :talkNotesHook="userTalkNotesHook"></slot>
        </div>
      </div>

      <div class="end">
        <div class="item">
          <slot name="upper-right" :talk="talk"></slot>
        </div>
      </div>
    </div>

    <div class="talkCard-content">
      <div class="title"
           :class="{'_hasTalkLand' : talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1}">
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
            <img v-if="speaker.photoUrl" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target)" />
            <img v-if="!speaker.photoUrl" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'" />
          </ion-thumbnail>
        </div>
      </div>
    </div>

    <div class="talkCard-footer">
      <div class="speakers">
        <ion-icon src="/assets/icons/solid/megaphone.svg"></ion-icon>
        <span class="speakers-list">{{displayedSpeakers}}</span>
      </div>
      <div class="talkActions">
        <slot name="footer-actions" :talk="talk" :talkNotesHook="userTalkNotesHook" />
      </div>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import {computed, PropType, ref} from "vue";
import {
  IonBadge,
  IonThumbnail,
} from '@ionic/vue';
import { VoxxrinTalk} from "@/models/VoxxrinTalk";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {UserTalkNotesHook, useUserTalkNotes} from "@/state/useUserTalkNotes";
import {TalkNote} from "../../../../shared/feedbacks.firestore";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";

const baseUrl = import.meta.env.BASE_URL;
function handle404OnSpeakerThumbnail(img: HTMLImageElement) {
    if(img.src !== baseUrl+'assets/images/svg/avatar-shadow.svg') {
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
})

defineEmits<{
    (e: 'talk-clicked', talk: VoxxrinTalk): void,
}>()

const talkLang = computed(() => {
    return props.confDescriptor!.supportedTalkLanguages.find(lang => lang.id.isSameThan(props.talk!.language))
})

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));

const userTalkNotesHook: UserTalkNotesHook = useUserTalkNotes(eventId, props.talk?.id)
const { talkNotes } = userTalkNotesHook;

const displayedSpeakers = props.talk!.speakers
    .map(s => `${s.fullName}${s.companyName?` (${s.companyName})`:``}`)
    .join(", ") || "???";

const hasTrack = (props.confDescriptor?.talkTracks.length || 0) > 1;

const theme = {
  track: {
    color: props.talk!.track.themeColor
  }
}
</script>

<style lang="scss" scoped>

//* Base styles card talk *//
.talkCard {
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  flex: 1;
  margin: 8px;
  border-left: 6px solid v-bind('theme.track.color');
  border-radius: 8px 12px 12px 8px;
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

      &._hasTalkLand { text-indent: 4px;}

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

    .speakers {
      display: flex;
      align-items: center;
      column-gap: 4px;
      padding: 8px;
      font-size: 12px;
      line-height: 1.1;
      letter-spacing: -0.4px;
      color: var(--app-grey-dark);
      font-weight: 500;

      @media (prefers-color-scheme: dark) {
        color: rgba(white, 0.7);

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
      background-image: url('assets/images/png/texture-favorited.png');
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
