<template>
  <ion-page>
    <ion-content class="speakerDetailsView"
                 :class="{'_scrolling-down': isScrollingDown}"
                 :scroll-events="true"
                 @ionScrollStart="handleScrollStart()"
                 @ionScroll="handleScroll($event)"
                 @ionScrollEnd="handleScrollEnd()"
                 v-themed-event-styles="confDescriptor"  v-if="confDescriptor && speaker">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="closeAndNavigateBack()"
                      :aria-label="LL.Close_speaker_details()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <div class="speakerInfoHeader" slot="start">
            <div class="speakerInfoHeader-avatar">
              <speaker-thumbnail size="48px" :is-highlighted="false" :speaker="speaker" />
            </div>

            <ion-text class="speakerInfoHeader-title">{{speaker.fullName}}</ion-text>
          </div>
        </ion-toolbar>
      </ion-header>

      <div class="speakerDetailsView-container">
        <div class="speakerDetailsView-head">
          <div class="speakerDetailsView-head-stats ion-text-left">
          </div>
          <div class="avatarContainer">
            <speaker-thumbnail size="144px" :is-highlighted="false" :speaker="speaker" />
          </div>
          <div class="speakerDetailsView-head-stats ion-text-right">
          </div>
        </div>
        <div class="speakerDetailsView-content">
          <div class="avatarInfos">
            <ion-text class="avatarInfos-title">{{speaker.fullName}}</ion-text>
            <ion-text class="avatarInfos-subTitle">
              <ion-icon :icon="businessSharp" aria-hidden="true"></ion-icon>
              {{speaker.companyName}}
            </ion-text>
          </div>
          <div class="speakerDetailsView-tabs">
            <div class="sectionBloc" v-if="speaker.bio">
              <VoxDivider>{{LL.Speaker_bio()}}</VoxDivider>
              <ion-text v-html="speaker.bio" />
            </div>
            <div class="sectionBloc" v-if="speaker.talks.length > 0">
              <VoxDivider>{{LL.Speaker_talks()}}</VoxDivider>
              <talk-card v-for="talk in speaker.talks" :key="talk.id.value" scope="speaker"
                             :talk="{ ...talk, speakers: [speaker, ...talk.otherSpeakers] }" :room-id="talk.allocation?.room.id" :talk-stats="talkStatsRefByTalkId.get(talk.id.value)"
                             :talk-notes="userEventTalkNotesRef.get(talk.id.value)"
                             @talk-clicked="(clickedTalk) => $emit('talk-clicked', clickedTalk)"
                             :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor">
                <template #upper-right>
                  <talk-room v-if="talk.allocation" :room="talk.allocation.room" :conf-descriptor="confDescriptor" />
                </template>
                <template #footer-actions="{ talkStats, talkNotes }">
                  <talk-watch-later-button v-if="confDescriptor"
                                           :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes"
                                           @talk-note-updated="updatedTalkNote => userEventTalkNotesRef.set(talk.id.value, updatedTalkNote) " />
                  <talk-favorite-button scope="schedule-talk" v-if="confDescriptor"
                                        :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes" :talk-stats="talkStats"
                                        :local-favorite="localEventTalkNotesRef.get(talk.id.value)"
                                        @talk-note-updated="updatedTalkNote => userEventTalkNotesRef.set(talk.id.value, updatedTalkNote) " />
                </template>
              </talk-card>
            </div>

            <div class="sectionBloc linksInfoSpeaker" v-if="speaker.social.length">
              <VoxDivider>{{ LL.Social_media() }}</VoxDivider>
              <ul class="linksInfoSpeaker-list">
                <li v-for="social in speaker.social" :key="social.type">
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
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";
import SpeakerThumbnail from "@/components/speaker/SpeakerThumbnail.vue";
import SocialMediaIcon from "@/components/ui/SocialMediaIcon.vue";
import {useLineupSpeaker} from "@/state/useEventSpeakers";
import {useLocalEventTalkFavsStorage, useUserEventTalkNotes} from "@/state/useUserTalkNotes";
import {computed, toValue} from "vue";
import {useEventTalkStats} from "@/state/useEventTalkStats";
import TalkCard from "@/components/talk-card/TalkCard.vue";
import TalkRoom from "@/components/talk-card/TalkRoom.vue";
import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";

const LOGGER = Logger.named("SpeakerDetailsPage");

const ionRouter = useIonRouter();
function closeAndNavigateBack() {
  goBackOrNavigateTo(ionRouter, `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/speakers`, 0 /* talk details page is always opened through popups */)
}

const route = useRoute();
const speakerId = ref(new SpeakerId(getRouteParamsValue(route, 'speakerId')));
const spacedEventIdRef = useCurrentSpaceEventIdRef();
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);
const {speaker} = useLineupSpeaker(confDescriptor, speakerId)

const { LL } = typesafeI18n()

const localEventTalkNotesRef = useLocalEventTalkFavsStorage(spacedEventIdRef)
const talkIdsRef = computed(() => {
  const unreffedSpeaker = toValue(speaker);
  if(!unreffedSpeaker) {
    return [];
  }

  const uniqueTalkIds = unreffedSpeaker.talks.map(talk => talk.id);
  return uniqueTalkIds;
})
const {userEventTalkNotesRef} = useUserEventTalkNotes(spacedEventIdRef, talkIdsRef)
const {firestoreEventTalkStatsRef: talkStatsRefByTalkId} = useEventTalkStats(spacedEventIdRef, talkIdsRef)


// * TODO #74 Check perf impact * //
const isScrollingDown = ref(false);
const handleScrollStart = () => {};
const handleScroll = (ev: CustomEvent) => {
  isScrollingDown.value = ev.detail.deltaY > 172;
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
        width: 44px;
        top: 50%;
        border-radius: 44px;
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

      .avatarContainer {
        margin-top: -64px;

        ion-avatar {
          margin: 0;
          border: 4px solid var(--ion-color-dark);
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
