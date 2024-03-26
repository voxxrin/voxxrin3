<template>
  <!-- TODO Dev Resume Card -->
  <ion-item class="talkResumeCard">
    <span class="talkResumeCard-line"></span>
    <div class="talkResumeCard-content">
      <ion-text class="talkResumeCard-content-description">
        Unlocking the Secrets of the Devoxx Mobile App: A Deep Dive into Open Source PWA with Vue and Firebase
      </ion-text>
      <div class="talkResumeCard-footer">
        <ion-badge class="trackBadge">
          <div class="trackBadge-content">
            <ion-icon src="/assets/icons/solid/tag.svg"></ion-icon>JAVA
          </div>
        </ion-badge>
        <div class="avatarContainer">
          <div class="avatarGroup" v-if="true">
            <div class="avatarItem">
              <ion-thumbnail class="avatar _small">
                <img v-if="false" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)"
                     :alt="LL.Avatar_Speaker() + ' ' + speaker.fullName"/>
                <img v-if="true" aria-hidden="true" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'" />
              </ion-thumbnail>
            </div>
          </div>
          <div class="avatarInfos _small">
            <ion-text class="avatarInfos-title">Conference</ion-text>
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
import {IonBadge, IonThumbnail} from "@ionic/vue";
const { LL } = typesafeI18n()
const baseUrl = import.meta.env.BASE_URL;
</script>

<style lang="scss" scoped>
  .talkResumeCard {
  --padding-start: 0;
  --inner-padding-top: var(--app-gutters-medium);
  --inner-padding-bottom: var(--app-gutters-medium);
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
</style>
