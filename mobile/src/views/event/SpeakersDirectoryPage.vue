<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header :conf-descriptor="confDescriptor" />
      <ion-header class="toolbarHeader">
        <ion-toolbar>
          <ion-title slot="start" >{{ LL.Speakers() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-card class="speakerCard">
        <div class="speakerCard-head">
          <div class="avatarContainer">
            <ion-thumbnail class="avatar _large">
              <img v-if="false" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)" />
              <img v-if="true" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'" />
            </ion-thumbnail>
            <div class="avatarInfos">
              <ion-text class="avatarInfos-title">Name speaker</ion-text>
              <ion-text class="avatarInfos-subTitle">
                <ion-icon :icon="businessSharp"></ion-icon>
                Company name
              </ion-text>
            </div>
          </div>
        </div>
        <div class="speakerCard-content">
          <ion-list class="talkResumeList">
            <ion-item class="talkResumeCard">
              <span class="talkResumeCard-line"></span>
              <div class="talkResumeCard-content">
                <ion-text class="talkResumeCard-content-description">
                  C'est pas Versailles ici ! Eteignez vos envs projets K8S la nuit pour sauver la planète.
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
                          <img v-if="false" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)" />
                          <img v-if="true" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'" />
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
                    <div class="avatarGroup" v-if="false">
                      <div class="avatarItem">
                        <ion-thumbnail class="avatar _small">
                          <img v-if="false" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)" />
                          <img v-if="true" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'" />
                        </ion-thumbnail>
                      </div>
                    </div>
                    <div class="avatarInfos _small">
                      <ion-text class="avatarInfos-title">Conference</ion-text>
                      <ion-text class="avatarInfos-subTitle" v-if="false">
                        (+X Speaker(s))
                      </ion-text>
                    </div>
                  </div>
                </div>
              </div>
            </ion-item>
          </ion-list>
        </div>
        <div class="speakerCard-footer">
          <div class="speakerActions">
            <ion-button class="btnActionCard btn-info">
              <span class="btn-favorite-group">
               <ion-icon name="heart-outline"></ion-icon>
              </span>
            </ion-button>
            <ion-button class="btnActionCard btn-follow">
                <span class="btn-favorite-group">
                  <ion-icon :icon="heartOutline"></ion-icon>
                </span>
            </ion-button>
          </div>
        </div>
      </ion-card>
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {useRoute} from "vue-router";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {managedRef as ref} from "@/views/vue-utils";
  import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";
  import {IonBadge, IonInput, IonThumbnail} from "@ionic/vue";
  import {business, businessSharp, heartOutline} from "ionicons/icons";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
  const baseUrl = import.meta.env.BASE_URL;
</script>

<style lang="scss" scoped>
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

      .talkResumeCard {
        --padding-start: 0;
        --inner-padding-top: var(--app-gutters-medium);
        --inner-padding-bottom: var(--app-gutters-medium);
        padding: 0;

        &:last-child { --border-style: none;}

        &-line {
          height: 100%;
          min-width: 2px;
          margin-right: var(--app-gutters-medium);
          border-radius: 4px;
          background: var(--app-primary);
        }

        &-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--app-gutters-medium);

          &-description {
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

      .speakerActions {
        display: flex;
        flex-direction: row;
      }
    }
  }
</style>
