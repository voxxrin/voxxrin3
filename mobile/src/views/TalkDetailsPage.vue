<template>
  <ion-page>
    <ion-content v-themed-event-styles="confDescriptor" :fullscreen="true" v-if="confDescriptor && detailedTalkRef">
      <ion-header class="stickyHeader" v-if="talkNotes" :class="{ 'is-favorited': talkNotes.isFavorite, 'to-watch-later': talkNotes.watchLater }">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="closeAndNavigateBack()"
          :aria-label="LL.Close_talk_details()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start" >{{ LL.Talk_details() }}</ion-title>
          <!-- TODO Fix dynamic aria-label -->
          <ion-button class="btnTalkAction _watchLater" slot="end" shape="round" fill="outline"
                      @click.stop="() => toggleWatchLater()" v-if="confDescriptor?.features.remindMeOnceVideosAreAvailableEnabled"
                      :aria-label="talkNotes?.watchLater ? LL.Remove_Watch_later() : LL.Add_Watch_later()">
            <ion-icon v-if="!talkNotes.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
            <ion-icon v-if="talkNotes.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
          </ion-button>
          <div class="favoriteGroup" slot="end" :class="{'_animationIn': talkNotes.isFavorite}" >
            <!-- TODO Fix dynamic aria-label -->
            <ion-button class="btnTalkAction _favorite"
                        shape="round" fill="outline" @click.stop="() => toggleFavorite(!!talkNotes?.isFavorite)"
                        v-if="confDescriptor?.features.favoritesEnabled"
                        :aria-label="talkNotes?.isFavorite ? LL.Remove_Favorites() : LL.Add_Favorites()">
              <ion-icon class="favorite-btn-icon" v-if="!talkNotes.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
              <ion-icon class="favorite-btn-icon" v-if="talkNotes.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
            </ion-button>
            <ion-label class="favorite-btn-nb" v-if="eventTalkStats !== undefined">
              <span>{{ eventTalkStats.totalFavoritesCount + (localFavorite || 0) }}</span>
            </ion-label>
          </div>
        </ion-toolbar>
      </ion-header>

      <talk-details-header :conf-descriptor="confDescriptor" :talk="detailedTalkRef">
        <room-capacity-indicator :spaced-event-id="spacedEventIdRef" :talk="detailedTalkRef" :room-stats="firestoreRoomStatsRef" :bottom-rounded="true" :show-unknown-capacity="false" />
      </talk-details-header>

      <div class="talkDetails-tags" v-if="detailedTalkRef?.tags.length">
        <div class="talkDetails-tags-list">
          <ion-badge v-if="true" class="tagBadge" v-for="(tag) in detailedTalkRef?.tags" :key="tag">
            <ion-icon aria-hidden="true" src="assets/icons/solid/tag.svg"></ion-icon>
            {{tag}}
          </ion-badge>
        </div>
      </div>


      <div v-if="maybeTalkRecording" class="talkDetails-recording">
        <vox-divider>
          {{ LL.Talk_Recording() }}
        </vox-divider>
        <recording-player :url="maybeTalkRecording.assetUrl" :platform="maybeTalkRecording.platform"></recording-player>
      </div>

      <div class="talkDetails-description">
        <vox-divider>
          {{ LL.Talk_summary() }}
        </vox-divider>
        <ion-text v-html="detailedTalkRef?.description">
        </ion-text>
      </div>

      <div class="talkDetails-speakers">
        <vox-divider>
          {{ LL.Speakers() }}
        </vox-divider>
        <ion-list class="talkDetails-speakers-list">
          <ion-item v-for="(speaker, index) in detailedTalkRef?.speakers" :key="speaker.id.value">
            <speaker-thumbnail size="64px" :is-highlighted="false" :speaker="speaker" />
            <div class="speakerInfo">
              <div class="speakerInfo-name">
                {{speaker.fullName}}
                <span class="speakerInfo-company" v-if="speaker.companyName">
                     <ion-icon aria-hidden="true" :icon="business"></ion-icon>
                  {{speaker.companyName}}
                </span>
              </div>
              <div class="speakerInfo-description">
                <div v-html="speaker.bio"></div>
              </div>
            </div>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {useRoute} from "vue-router";
import {getRouteParamsValue, isRefDefined, managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {useLocalEventTalkFavsStorage, useUserEventTalkNotes, useUserTalkNoteActions,} from "@/state/useUserTalkNotes";
import {findAssetOfType, TalkId} from "@/models/VoxxrinTalk";
import {useSharedEventTalk} from "@/state/useEventTalk";
import {computed, toValue} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonBadge, IonText, useIonRouter} from "@ionic/vue";
import {business} from "ionicons/icons";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import VoxDivider from "@/components/ui/VoxDivider.vue";
import {goBackOrNavigateTo} from "@/router";
import TalkDetailsHeader from "@/components/talk-details/TalkDetailsHeader.vue";
import {useEventTalkStats} from "@/state/useEventTalkStats";
import {Logger} from "@/services/Logger";
import RoomCapacityIndicator from "@/components/rooms/RoomCapacityIndicator.vue";
import {useRoomStats} from "@/state/useRoomsStats";
import SpeakerThumbnail from "@/components/speaker/SpeakerThumbnail.vue";
import RecordingPlayer from "@/components/ui/RecordingPlayer.vue";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

const LOGGER = Logger.named("TalkDetailsPage");

const ionRouter = useIonRouter();
function closeAndNavigateBack() {
    goBackOrNavigateTo(ionRouter, `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/schedule`, 0 /* talk details page is always opened through popups */)
}

const spacedEventIdRef = useCurrentSpaceEventIdRef();
const route = useRoute();
const talkId = ref(new TalkId(getRouteParamsValue(route, 'talkId')));
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);

const { userEventTalkNotesRef } = useUserEventTalkNotes(spacedEventIdRef, toRef(() => talkId ? [talkId.value] : undefined))
const talkNotes = toRef(() => {
    const userEventTalkNotes = toValue(userEventTalkNotesRef)
    return Array.from(userEventTalkNotes.values())[0];
})
const {firestoreEventTalkStatsRef} = useEventTalkStats(spacedEventIdRef, toRef(() => talkId ? [talkId.value] : undefined));
const eventTalkStats = computed(() => {
    const firestoreEventTalkStats = toValue(firestoreEventTalkStatsRef);
    return Array.from(firestoreEventTalkStats.values())[0];
})
const { talkDetails: detailedTalkRef } = useSharedEventTalk(confDescriptor, talkId);
const { LL } = typesafeI18n()

const {toggleFavorite, toggleWatchLater} = useUserTalkNoteActions(
    spacedEventIdRef, talkId,
    talkNotes,
);
const localEventTalkNotesRef = useLocalEventTalkFavsStorage(spacedEventIdRef)
const localFavorite = computed(() => {
  const localEventTalkNotes = toValue(localEventTalkNotesRef),
    _talkId = toValue(talkId);

  return localEventTalkNotes.get(_talkId.value);
})

const maybeTalkRecording = computed(() => {
  const detailedTalk = toValue(detailedTalkRef);
  if(!detailedTalk) {
    return undefined;
  }

  return findAssetOfType(detailedTalk, 'recording');
})

const theme = computed(() => {
    if(isRefDefined(detailedTalkRef)) {
        return {
            track: {
                color: detailedTalkRef.value.track.themeColor
            }
        }
    } else {
        return undefined;
    }
});

const {firestoreRoomStatsRef } = useRoomStats(spacedEventIdRef, toRef(() => detailedTalkRef.value?.room.id))

</script>

<style lang="scss" scoped>
  ion-header {
    ion-toolbar {
      padding-top: 0;

      &:before, &:after {
        position: absolute;
        content: '';
        z-index: 1;
      }

    }

    &.to-watch-later{
      .btnTalkAction._watchLater {
        --background: var(--voxxrin-event-theme-colors-tertiary-hex);
        --background-activated: var(--voxxrin-event-theme-colors-tertiary-hex);
        --color-activated: var(--app-white);
        --color: var(--app-white);
      }

      ion-toolbar {
        &:before {
          background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-tertiary-rgb), 0.6) 30%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6) 80%) !important;
        }
      }
    }

    &.is-favorited {
      .btnTalkAction._favorite {
        --background: var(--voxxrin-event-theme-colors-primary-hex);
        --background-activated: var(--voxxrin-event-theme-colors-primary-hex);
        --color-activated: var(--app-white);
        --border-color:  var(--voxxrin-event-theme-colors-primary-hex);
        --color: var(--app-white);
      }

      .favorite-btn-nb {
        background: var(--app-primary) !important;
        color: var(--app-white);

        @media (prefers-color-scheme: dark) {
          background: var(--app-white) !important;
          color: var(--app-primary);
        }
      }

      ion-toolbar {
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
          background-repeat: no-repeat;
          background-image: url('/assets/images/png/texture-favorited.png');
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
      }
    }

    .favoriteGroup {
      &._animationIn {
        .favorite-btn-icon { animation: jello-vertical 800ms both;}
        .favorite-btn-nb > span {
          display: block;
          animation: pulsate-fwd 400ms ease-in-out both;
        }
      }
    }

    .btnTalkAction {
      height: 48px;
      width: 48px;
      --padding-start: 0;
      --padding-end: 0;
      font-size: 22px;

      @media (prefers-color-scheme: dark) {
        --border-style: none;
        --background: var(--app-light-contrast);
      }

      &._favorite {
        display: flex;

        .favorite-btn-icon {
          font-size: 30px !important;
        }
      }
    }
  }

  .talkDetails {
    &-tags {
      padding: 16px;
      background: var(--app-beige-medium);

      @media (prefers-color-scheme: dark) {
        --border-style: none;
        background: var(--app-dark-contrast);
      }

      &-list {
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        column-gap: 8px;
        row-gap: 8px;

        .tagBadge {
          --padding-start: 16px;
          --padding-end: 16px;
          font-weight: 500;
          --background: var(--app-white-90);
          border: 1px solid var(--app-grey-line);
          color: var(--app-primary);

          ion-icon { color: var(--app-primary);}

          @media (prefers-color-scheme: dark) {
            background: var(--app-light-contrast);
            color: var(--app-white);

            ion-icon { color: var(--app-white);}
          }
        }
      }
    }

    &-description, &-recording {
      padding: var(--app-gutters);

      /**
      Enforcing color for talk description, in case HTML coming from CFP overrides some colors, with
      bad contrast to our UI
       */
      :deep {
        * {
          color: var(--app-primary) !important;

          @media (prefers-color-scheme: dark) {
            color: var(--app-white) !important;
          }
        }
      }
    }

    &-speakers {
      background-color: var(--app-beige-medium);
      padding: var(--app-gutters);

      @media (prefers-color-scheme: dark) {
        background-color: var(--app-medium-contrast);
      }

      &-list {
       padding-top: var(--app-gutters);
       padding-bottom: var(--app-gutters);
       background-color: var(--app-beige-medium);

        @media (prefers-color-scheme: dark) {
          background-color: var(--app-medium-contrast);
        }

        ion-item {
          --background: var(--app-beige-medium);
          --padding-start: 0;
          --inner-padding-end: 0;
          --padding-top: 8px;
          --padding-bottom: 8px;
          align-items: start;

          @media (prefers-color-scheme: dark) {
            --background: var(--app-medium-contrast);
          }

          &:last-child {
            --border-style: none;
          }

          .speakerInfo {
            display: flex;
            flex-direction: column;

            &-name {
              display: flex;
              flex-direction: column;
              margin-bottom: 8px;
              font-weight: bold;
              user-select: all;
            }

            &-company {
              display: flex;
              column-gap: 4px;
              margin: 4px 0;
              align-items: center;
              font-weight: normal;
              font-size: 13px;
              color: var(--app-grey-dark);

              @media (prefers-color-scheme: dark) {
                color: var(--app-grey-light);
                opacity: 0.5;
              }

              ion-icon {
                font-size: 16px;
              }
            }

            &-description {
              padding-bottom: 12px;
              font-size: 14px;

              /**
               Enforcing color for speaker description, in case HTML coming from CFP overrides some colors, with
               bad contrast to our UI
                */
              :deep {
                * {
                  color: var(--app-primary) !important;
                }

                @media (prefers-color-scheme: dark) {
                  * { color: var(--app-white) !important;}
                }
              }
            }
          }
        }
      }
    }
  }
</style>
