<template>
  <!-- TODO Dev Resume Card -->
  <ion-item class="talkResumeCard" :class="{'_has-favorited': false}">
    <span class="talkResumeCard-line"></span>
    <div class="talkResumeCard-content">
      <div class="talkResumeCard-content-description">
        <ion-text>
          Unlocking the Secrets of the Devoxx Mobile App: A Deep Dive into Open Source PWA with Vue and Firebase
        </ion-text>
        <SpeakerFavTalkButton></SpeakerFavTalkButton>
      </div>
      <div class="talkResumeCard-footer">
        <div class="talkResumeCard-footer-left">
          <ion-badge class="trackBadge">
            <div class="trackBadge-content">
              <ion-icon src="/assets/icons/solid/tag.svg"></ion-icon>
              JAVA
            </div>
          </ion-badge>
          <div class="bulletTag _labelOnly">Conf.</div>
        </div>

        <div class="avatarContainer">
          <div class="avatarGroup" v-if="true">
            <div class="avatarItem">
              <ion-thumbnail class="avatar _small">
                <img v-if="false" :src="speaker.photoUrl"
                     @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)"
                     :alt="LL.Avatar_Speaker() + ' ' + speaker.fullName"/>
                <img v-if="true" aria-hidden="true" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'"/>
              </ion-thumbnail>
            </div>
          </div>
          <div class="avatarInfos _small">
            <ion-text class="avatarInfos-subTitle" v-if="true">
              (+X Speaker(s))
            </ion-text>
          </div>
        </div>
      </div>
    </div>
  </ion-item>
</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonBadge, IonThumbnail, IonText} from "@ionic/vue";
import SpeakerFavTalkButton from "@/components/speaker-card/SpeakerFavTalkButton.vue";

const {LL} = typesafeI18n()
const baseUrl = import.meta.env.BASE_URL;
</script>

<style lang="scss" scoped>
.talkResumeCard {
  --background: transparent;
  --inner-padding-end: 0;
  --inner-padding-top: var(--app-gutters-medium);
  --inner-padding-bottom: var(--app-gutters-medium);
  overflow: visible;

  @media (prefers-color-scheme: dark) {
    --border-color: var(--app-dark-contrast);
  }

  &:last-child {
    --border-style: none;
    --inner-padding-bottom: 0;
  }

  &._has-favorited {

    .talkResumeCard-line {
      background: var(--voxxrin-event-theme-colors-primary-hex);
    }

    .talkResumeCard-content {
      &:before {
        width: 84px;
        height: 60%;
        right: -44px;
        top: 16px;
        transform: scale(1);
        background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.8) 30%,
            rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.8) 80%);
        opacity: 1;
        filter: blur(24px);
        animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
      }

      &:after {
        width: 84px;
        height: 60%;
        right: -44px;
        top: 16px;
        background-image: url('/assets/images/png/texture-favorited.png');
        background-repeat: no-repeat;
        background-position: right;
        background-size: cover;
        transform: scale(1) translate(0, -50%);;
        opacity: 0.5;
        mix-blend-mode: overlay;
        animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;

        @media (prefers-color-scheme: dark) {
          mix-blend-mode: difference;
        }
      }
    }
  }

  &-line {
    height: 100%;
    min-width: 2px;
    margin-right: var(--app-gutters-medium);
    border-radius: 4px;
    background: var(--app-primary);

    @media (prefers-color-scheme: dark) {
      background: var(--app-white-50);
    }
  }

  &-content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--app-gutters-small);
    padding-right: var(--app-gutters-medium);
    background: var(--app-white);

    @media (prefers-color-scheme: dark) {
      background: transparent;
    }

    &:before, &:after {
      position: absolute;
      content: '';
      z-index: 0;
      pointer-events: none;
    }

    &-description {
      display: flex;
      width: 100%;
      font-size: 14px;
      line-height: 1.2;
      color: var(--app-primary);

      ion-text {
        flex: 1;
        line-height: 1.4;
        padding-right: var(--app-gutters-small);

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }
    }
  }

  &-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    &-left {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--app-gutters-medium)
    }

    .avatarContainer {
      gap: var(--app-gutters);
    }

    .avatarInfos {
      justify-content: end;
    }
  }
}
</style>
