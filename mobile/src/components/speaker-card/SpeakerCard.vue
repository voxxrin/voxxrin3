<template>
  <!-- TODO Dev Card Speaker List -->
  <ion-card class="speakerCard"
            :class="{ '_is-highlighted': true, '_has-liked': true}">
    <div class="speakerCard-head">
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
    </div>
    <div class="speakerCard-content">
      <ion-list class="talkResumeList">
        <SpeakerResumeTalk></SpeakerResumeTalk>
      </ion-list>
    </div>
    <div class="speakerCard-footer">
      <div class="speakerActions">
        <ion-button class="btnActionCard" :aria-label="LL.View_Profil_Speaker()">
          <ion-icon  aria-hidden="true" src="/assets/icons/solid/info-circle.svg"></ion-icon>
        </ion-button>
        <SpeakerLikeButton></SpeakerLikeButton>
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
  import SpeakerLikeButton from "@/components/speaker-card/SpeakerLikeButton.vue";
  import SpeakerResumeTalk from "@/components/speaker-card/SpeakerResumeTalk.vue";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
  const baseUrl = import.meta.env.BASE_URL;
</script>

<style lang="scss">
  .speakerCard {
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

    .speakerCard-footer {
      border-width: 2px;
      border-color: var(--app-primary);
      border-bottom: none;

      @media (prefers-color-scheme: dark) {
        border-color: var(--app-white) !important;
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

      .btnActionCard {
        border-color: var(--app-primary-shade);
        border-width: 2px;

        @media (prefers-color-scheme: dark) {
          border-color: var(--app-white);
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
      height: 50%;
      right: 0;
      bottom: 0;
      transform: scale(1);
      background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4) 30%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4) 80%);
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
      opacity: 1;
      mix-blend-mode: overlay;
      animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;

      @media (prefers-color-scheme: dark) {
        mix-blend-mode: difference;
      }
    }
  }

  &-head {
    display: flex;
    align-items: center;
    gap: var(--app-gutters-medium);
    padding: var(--app-gutters) var(--app-gutters) var(--app-gutters-small) var(--app-gutters);
  }

  &-content {
    display: flex;
    column-gap: var(--app-gutters);
    justify-content: space-between;
    padding: 0 var(--app-gutters) var(--app-gutters-small) var(--app-gutters);


    .talkResumeList {
      background: transparent;
      width: 100%;
    }

    .talkResumeCard {
      --padding-start: 0;
      --inner-padding-top: var(--app-gutters-medium);
      --inner-padding-bottom: var(--app-gutters-medium);
      --background: transparent;
      padding: 0;

      &:last-child {
        --border-style: none;
        --inner-padding-bottom: 0;
      }

      &-line {
        height: 100%;
        min-width: 2px;
        margin-right: var(--app-gutters-medium);
        border-radius: 4px;
        background: var(--app-primary);

        @media (prefers-color-scheme: dark) {
          background: var(--app-white-90);
        }
      }

      &-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--app-gutters-medium);

        &-description {
          width: 100%;
          font-size: 14px;
          line-height: 1.2;
          color: var(--app-primary);

          @media (prefers-color-scheme: dark) {
            color: var(--app-white);
          }
        }
      }

      &-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        .avatarContainer {
          gap: var(--app-gutters);
        }

        .avatarInfos {
          justify-content: end;
        }
      }
    }
  }

  &-footer {
    display: flex;
    column-gap: 16px;
    justify-content: end;
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

    .speakerActions {
      display: flex;
      flex-direction: row;
    }
  }
}
</style>
