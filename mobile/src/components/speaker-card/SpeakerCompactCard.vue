<template>
  <!-- TODO Dev Card Speaker List -->
  <ion-card class="speakerCompactCard"
            :class="{ '_is-highlighted': true, '_has-liked': true}">
    <div class="speakerCompactCard-head">
      <div class="avatarContainer">
        <ion-thumbnail class="avatar _large">
          <img v-if="false" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)"
               :alt="LL.Avatar_Speaker() + ' ' + speaker.fullName"/>
          <img v-if="true" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'" aria-hidden="true"/>
        </ion-thumbnail>
        <div class="avatarInfos">
          <ion-text class="avatarInfos-title">Name speaker</ion-text>
          <ion-text class="avatarInfos-subTitle">
            <ion-icon :icon="businessSharp" aria-hidden="true"></ion-icon>
            Company name
          </ion-text>
        </div>
      </div>
      <ion-buttons>
        <ion-button fill="clear" class="button-round button-small" :aria-label="LL.View_Profil_Speaker()">
          <ion-icon slot="icon-only" aria-hidden="true" src="/assets/icons/solid/info-circle.svg"></ion-icon>
        </ion-button>
        <div class="likeGroup" slot="end">
          <ion-button fill="outline" class="btnSpeakerAction button-round button-small" :aria-label="LL.Like_Speaker()">
            <ion-icon class="btnActionCard-group-icon" v-if="true" aria-hidden="true" src="/assets/icons/line/heart-line.svg"></ion-icon>
            <ion-icon class="btnActionCard-group-icon" v-if="false" aria-hidden="true" src="/assets/icons/solid/heart.svg"></ion-icon>
          </ion-button>
          <ion-label class="like-btn-nb" v-if="true">0</ion-label>
        </div>
      </ion-buttons>
    </div>
    <div class="speakerCompactCard-footer">
      <div class="bulletTagList" role="list">
        <div class="bulletTag" role="listitem">
          <span class="bulletTag-nb">2</span>
          Conf.
        </div>
        <div class="bulletTag" role="listitem">
          <span class="bulletTag-nb">1</span>
          TiA.
        </div>
      </div>
    </div>
  </ion-card>
</template>


<script setup lang="ts">
  import {useRoute} from "vue-router";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {managedRef as ref} from "@/views/vue-utils";
  import {IonThumbnail} from "@ionic/vue";
  import {businessSharp} from "ionicons/icons";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
  const baseUrl = import.meta.env.BASE_URL;
</script>

<style lang="scss">
.speakerCompactCard {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 8px;
  border-radius: var(--app-card-radius);
  border: {
    top: 1px solid var(--app-grey-line);
    right: 1px solid var(--app-grey-line);
  }
  box-shadow: var(--app-shadow-default);
  transition: 80ms ease-in-out;

  @media (prefers-color-scheme: dark) {
    background: var(--app-light-contrast);
    border : {
      top: 1px solid var(--app-line-contrast);
      right: 1px solid var(--app-line-contrast);
    }
  }

  //* States card talk *//
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

  &._is-highlighted {
    border : {
      top: 2px solid var(--app-primary);
      bottom: 2px solid var(--app-primary);
      right: 2px solid var(--app-primary);
      left: 2px solid var(--app-primary);
    }

    @media (prefers-color-scheme: dark) {
      border : {
        top: 2px solid var(--app-white) !important;
        bottom: 2px solid var(--app-white) !important;
        right: 2px solid var(--app-white) !important;
        left: 2px solid var(--app-white) !important;
      }
    }

    ion-thumbnail {
      background-color: var(--app-background);
      border: 2px solid var(--app-primary);

      @media (prefers-color-scheme: dark) {
        border: 2px solid var(--app-white) !important;
      }
    }

    &._has-liked {
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
      }
    }
  }

  &._has-liked {
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

    .speakerCompactCard-head {
      .btnSpeakerAction {
        --background: var(--voxxrin-event-theme-colors-primary-hex);
        --background-activated: var(--voxxrin-event-theme-colors-primary-hex);
        --color-activated: var(--app-white);
        --border-color: var(--voxxrin-event-theme-colors-primary-hex);
        --color: var(--app-white);
      }
    }
  }

  &-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-gutters-medium);
    padding: var(--app-gutters) var(--app-gutters-medium) var(--app-gutters) 72px;

    ion-buttons {
      column-gap: 4px;
    }

    .avatar {
      position: absolute;
      left: -18px;
      top: -8px;
      --size: 74px;
    }
  }

  .likeGroup {
    position: relative;

    .like-btn-nb {
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translate(-50%, 0);
      padding: 0 12px;
      font-size: 14px;
      color: var(--app-primary);
      font-weight: bold;

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }
  }

  &-footer {
    display: flex;
    column-gap: 16px;
    padding: 0 var(--app-gutters-small) var(--app-gutters-small) 72px;
  }
}

.bulletTagList {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.bulletTag {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding-right: var(--app-gutters-small);
  border-radius: 34px;
  font-weight: 900;
  font-size: 12px;
  color: var(--app-primary);
  border: 1px solid var(--app-primary);
  background-color: var(--app-background);

  @media (prefers-color-scheme: dark) {
    color: var(--app-white);
    border: 1px solid var(--app-white);
    background-color: transparent;
  }

  &-nb {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    min-width: 20px;
    padding: 0 4px;
    border-radius: 22px;
    background-color: var(--app-primary-shade);
    color: var(--app-white);

    @media (prefers-color-scheme: dark) {
      border-right: 1px solid var(--app-white);
      background-color: var(--app-medium--contrast);
    }
  }
}
</style>
