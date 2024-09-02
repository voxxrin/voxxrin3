<template>
  <ion-page>
    <ion-content class="speakerDetailsView"
                 :class="{'_scrolling-down': isScrollingDown}"
                 :scroll-events="true"
                 @ionScrollStart="handleScrollStart()"
                 @ionScroll="handleScroll($event)"
                 @ionScrollEnd="handleScrollEnd()"
                 v-themed-event-styles="confDescriptor"  v-if="confDescriptor && detailedSpeaker">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="closeAndNavigateBack()"
                      :aria-label="LL.Close_speaker_details()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <div class="speakerInfoHeader" slot="start">
            <ion-avatar class="speakerInfoHeader-avatar">
              <speaker-thumbnail size="64px" :is-highlighted="false" :speaker="detailedSpeaker" />
            </ion-avatar>
            <ion-text class="speakerInfoHeader-title">{{detailedSpeaker.fullName}}</ion-text>
          </div>
        </ion-toolbar>
      </ion-header>

      <div class="speakerDetailsView-container">
        <div class="speakerDetailsView-head">
          <div class="speakerDetailsView-head-stats ion-text-left">
            <ion-label>Total talks</ion-label>
            <span class="count">-</span>
          </div>
          <ion-avatar class="speakerAvatar">
            <speaker-thumbnail size="64px" :is-highlighted="false" :speaker="detailedSpeaker" />
          </ion-avatar>
          <div class="speakerDetailsView-head-stats ion-text-right">
            <ion-label>Total favorites</ion-label>
            <span class="count">-</span>
          </div>
        </div>
        <div class="speakerDetailsView-content">
          <div class="avatarInfos">
            <ion-text class="avatarInfos-title">{{detailedSpeaker.fullName}}</ion-text>
            <ion-text class="avatarInfos-subTitle">
              <ion-icon :icon="businessSharp" aria-hidden="true"></ion-icon>
              {{detailedSpeaker.companyName}}
            </ion-text>
          </div>
          <div class="speakerDetailsView-tabs">
            <ion-segment class="tabsSelection _clearMode" value="talks">
              <ion-segment-button value="talks">
                <ion-label>Talks</ion-label>
              </ion-segment-button>
              <ion-segment-button value="infos">
                <ion-label>Infos</ion-label>
              </ion-segment-button>
            </ion-segment>
            <div class="sectionBloc">
              <VoxDivider>{{LL.Speaker_bio()}}</VoxDivider>
              <ion-text>
                {{detailedSpeaker.bio}}
              </ion-text>
            </div>

            <div class="sectionBloc linksInfoSpeaker" v-if="detailedSpeaker.social.length">
              <VoxDivider>{{ LL.Social_media() }}</VoxDivider>
              <ul class="linksInfoSpeaker-list">
                <li v-for="social in detailedSpeaker.social" :key="social.type">
                  <social-media-icon :href="social.url" :type="social.type"></social-media-icon>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue, managedRef as ref} from "@/views/vue-utils";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonAvatar, IonSegment, IonSegmentButton, IonText, useIonRouter} from "@ionic/vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {goBackOrNavigateTo} from "@/router";
import {Logger} from "@/services/Logger";
import {SpeakerId, VoxxrinDetailedSpeaker} from "@/models/VoxxrinSpeaker";
import {businessSharp} from "ionicons/icons";
import VoxDivider from "@/components/ui/VoxDivider.vue";
import {useCurrentSpaceEventIdRef} from "@/services/Spaces";
import SpeakerThumbnail from "@/components/speaker/SpeakerThumbnail.vue";
import SocialMediaIcon from "@/components/ui/SocialMediaIcon.vue";

const LOGGER = Logger.named("TalkDetailsPage");

const ionRouter = useIonRouter();
function closeAndNavigateBack() {
    goBackOrNavigateTo(ionRouter, `/events/${eventId.value.value}/speakers`, 0 /* talk details page is always opened through popups */)
}

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const speakerId = ref(new SpeakerId(getRouteParamsValue(route, 'speakerId')));
const spacedEventIdRef = useCurrentSpaceEventIdRef();
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);

const { LL } = typesafeI18n()

const detailedSpeaker: VoxxrinDetailedSpeaker = {
  id: new SpeakerId('42'),
  fullName: "Frédéric Camblor",
  companyName: "4SH",
  photoUrl: "https://lh3.googleusercontent.com/a/AAcHTtdsbTGnaxXmrzSi178m_qpxj9c-z12qoL7SLB6cjUSfZhaQ=s96-c",
  bio: `Retired Bordeaux JUG leader and co-creator of the BDX I/O conference in 2014, Frédéric enjoys mixing with different tech communities and learning new things.
Web developer at 4SH by day, and OSS commiter by night, he has created/contributed to some more or less well known projects: Voxxrin app, Vitemadose frontend during COVID Pandemic, Devoxx France CFP, RestX framework, as well as some (old) Jenkins plugins.
As a big fan of strong typing, he loves Typescript, but also like doing all kinds of stuff in Google Spreadsheets.`,
  social: [
    {type:'twitter', url: 'https://www.twitter.com/fcamblor' }
  ]
}


// * TODO #74 Check perf impact * //
const isScrollingDown = ref(false);
const handleScrollStart = () => {};
const handleScroll = (ev: CustomEvent) => {
  isScrollingDown.value = ev.detail.deltaY > 0;
};
const handleScrollEnd = () => {};
</script>

<style lang="scss" scoped>
  .speakerDetailsView {
    &._scrolling-down {
      ion-header {
        background: var(--app-background);

        @media (prefers-color-scheme: dark) {
          box-shadow: none;
          background: var(--app-background);
        }

        .speakerInfoHeader {
          opacity: 1;
          transition: opacity 240ms ease-in-out;
        }
      }
    }

    .speakerInfoHeader {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 16px;
      opacity: 0;
      transition: opacity 240ms ease-in-out;

      &-avatar {
        height: 54px;
        width: 54px;
        top: 50%;
        border: 2px solid var(--app-white);

        @media (prefers-color-scheme: dark) {
          border: none;
        }
      }

      &-title {
        font-size: 16px;
        font-weight: bold;
      }
    }

    ion-header {
      box-shadow: none;
      transition: 240ms ease-in-out;
      z-index: 1;

      ion-toolbar {
        --background: transparent;
        padding-top: 0;
      }

      .speakerAvatarHeader {
        opacity: 0;
      }
    }

    &-container {
      display: flex;
      flex-direction: column;
      border-radius: var(--app-gutters-large) var(--app-gutters-large) 0 0;
      background: var(--app-white);
      min-height: 100%;
      box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;

      @media (prefers-color-scheme: dark) {
        background: var(--app-medium-contrast);
      }
    }

    &-head {
      display: flex;
      justify-content: space-between;
      position: relative;
      padding: var(--app-gutters-large);
      padding-bottom: 0;

      &-stats {
        display: flex;
        flex-direction: column;

        .count {
          font-size: 22px;
          font-weight: bold;
        }
      }

      .speakerAvatar {
        height: 124px;
        width: 124px;
        margin-top: -64px;
        border: 8px solid var(--app-white);

        @media (prefers-color-scheme: dark) {
          border: 8px solid var(--app-medium-contrast);
        }
      }
    }

    &-content {
      .avatarInfos {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-top: 16px;
        gap: var(--app-gutters-tiny);

        &-title {
          flex: 1 1 0;
          font-weight: 900;
          color: var(--app-primary);
          font-size: 24px;
          line-height: 1.2;

          @media (prefers-color-scheme: dark) {
            color: var(--app-white);
          }
        }

        &-subTitle {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--app-gutters-tiny);
          color: var(--app-grey-dark);
          font-weight: 500;

          @media (prefers-color-scheme: dark) {
            color: var(--app-white-90);
          }
        }
      }
    }

   .linksInfoSpeaker {
     &-list {
       display: flex;
       flex-direction: row;
       flex-wrap: wrap;
       column-gap: 8px;
       margin: 0;
       padding: 0;

       li {
         list-style: none;
       }
     }
   }

    &-tabs {
      padding: var(--app-gutters);

      ion-segment {
        margin-bottom:  var(--app-gutters);
        padding: var(--app-gutters) 0;
      }
    }
  }
</style>
