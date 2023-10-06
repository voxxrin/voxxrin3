<template>
  <ion-page>
    <ion-content v-themed-event-styles="confDescriptor" :fullscreen="true" v-if="confDescriptor && detailedTalk">
      <ion-header class="stickyHeader" v-if="talkNotes" :class="{ 'is-favorited': talkNotes.isFavorite, 'to-watch-later': talkNotes.watchLater }">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="closeAndNavigateBack()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start" >{{ LL.Talk_details() }}</ion-title>
          <ion-button class="btnTalkAction _watchLater" slot="end" shape="round" fill="outline"  @click.stop="() => toggleWatchLater()" v-if="confDescriptor?.features.remindMeOnceVideosAreAvailableEnabled">
            <ion-icon v-if="!talkNotes.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
            <ion-icon v-if="talkNotes.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
          </ion-button>
          <div class="favoriteGroup" slot="end">
            <ion-button class="btnTalkAction _favorite" shape="round" fill="outline" @click.stop="() => toggleFavorite()" v-if="confDescriptor?.features.favoritesEnabled">
              <ion-icon class="favorite-btn-icon" v-if="!talkNotes.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
              <ion-icon class="favorite-btn-icon" v-if="talkNotes.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
            </ion-button>
            <ion-label class="favorite-btn-nb" v-if="eventTalkStats !== undefined">{{ eventTalkStats.totalFavoritesCount }}</ion-label>
          </div>
        </ion-toolbar>
      </ion-header>

      <talk-details-header :conf-descriptor="confDescriptor" :talk="detailedTalk"></talk-details-header>

      <div class="talkDetails-tags" v-if="detailedTalk?.tags.length">
        <div class="talkDetails-tags-list">
          <ion-badge v-if="true" class="tagBadge" v-for="(tag) in detailedTalk?.tags" :key="tag">
            <ion-icon aria-hidden="true" src="assets/icons/solid/tag.svg"></ion-icon>
            {{tag}}
          </ion-badge>
        </div>
      </div>


      <div class="talkDetails-description">
        <vox-divider>
          {{ LL.Talk_summary() }}
        </vox-divider>
        <ion-text v-html="detailedTalk?.description">
        </ion-text>
      </div>

      <div class="talkDetails-speakers">
        <vox-divider>
          {{ LL.Speakers() }}
        </vox-divider>
        <ion-list class="talkDetails-speakers-list">
          <ion-item v-for="(speaker, index) in detailedTalk?.speakers" :key="speaker.id.value">
            <ion-avatar>
              <img :src="speaker.photoUrl" v-if="speaker.photoUrl"/>
              <img src="/assets/images/svg/avatar-shadow.svg" v-if="!speaker.photoUrl"/>
            </ion-avatar>
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

      <div class="navigationBar">
        <div class="navigationBar-previous">
          <ion-button slot="start" shape="round" size="small">
            <ion-icon :icon="arrowBackCircleOutline"></ion-icon>
            <span class="btnNavLabel">Prev <small>talk</small></span>
          </ion-button>
        </div>

        <ion-popover class="slotSelectorDropdown"
                     trigger="popover-button"
                     :dismiss-on-select="false"
                     size="auto"
                     side="top" alignment="center">
          <ion-content>
            <ion-list>
              <ion-item :button="true" :detail="false">18:00 - 19:00</ion-item>
              <ion-item :button="true" :detail="false">17:00 - 18:00</ion-item>
              <ion-item :button="true" :detail="false">16:00 - 17:00</ion-item>
              <ion-item :button="true" :detail="false">15:00 - 16:00</ion-item>
              <ion-item :button="true" :detail="false">14:00 - 15:00</ion-item>
              <ion-item :button="true" :detail="false">12:30 - 14h:00</ion-item>
              <ion-item :button="true" :detail="false" class="_isActive">
                09:30 - 12:30
              </ion-item>
            </ion-list>
          </ion-content>
        </ion-popover>

        <div class="currentSlot">
          <ion-button id="popover-button" class="slotSelector">
            <ion-text> 09:30 - 12:30 <ion-icon :icon="chevronUp"></ion-icon></ion-text>
          </ion-button>

          <ul class="bulletsList">
            <li class="bulletsList-item"></li>
            <li class="bulletsList-item _isActive"></li>
            <li class="bulletsList-item"></li>
            <li class="bulletsList-item"></li>
          </ul>
        </div>

        <div class="navigationBar-next">
          <ion-button slot="start" shape="round" size="small">
            <span class="btnNavLabel">Next <small>talk</small></span>
            <ion-icon :icon="arrowForwardCircleOutline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue, isRefDefined, toManagedRef as toRef, managedRef as ref} from "@/views/vue-utils";
import {
    useUserEventTalkNotes,
    useUserTalkNoteActions,
} from "@/state/useUserTalkNotes";
import {TalkId} from "@/models/VoxxrinTalk";
import {useSharedEventTalk} from "@/state/useEventTalk";
import {computed, toValue} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonBadge, IonAvatar, IonText, useIonRouter} from "@ionic/vue";
import {arrowBackCircleOutline, arrowForwardCircleOutline, business, checkmarkCircle, chevronUp} from "ionicons/icons";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import VoxDivider from "@/components/ui/VoxDivider.vue";
import {goBackOrNavigateTo} from "@/router";
import TalkDetailsHeader from "@/components/talk-details/TalkDetailsHeader.vue";
import {useEventTalkStats} from "@/state/useEventTalkStats";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("TalkDetailsPage");

const ionRouter = useIonRouter();
function closeAndNavigateBack() {
    goBackOrNavigateTo(ionRouter, `/events/${eventId.value.value}/schedule`, 0 /* talk details page is always opened through popups */)
}

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = ref(new TalkId(getRouteParamsValue(route, 'talkId')));
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const { userEventTalkNotesRef } = useUserEventTalkNotes(eventId, toRef(() => talkId ? [talkId.value] : undefined))
const talkNotes = toRef(() => {
    const userEventTalkNotes = toValue(userEventTalkNotesRef)
    return Array.from(userEventTalkNotes.values())[0];
})
const {firestoreEventTalkStatsRef} = useEventTalkStats(eventId, toRef(() => talkId ? [talkId.value] : undefined));
const eventTalkStats = computed(() => {
    const firestoreEventTalkStats = toValue(firestoreEventTalkStatsRef);
    return Array.from(firestoreEventTalkStats.values())[0];
})
const { talkDetails: detailedTalk } = useSharedEventTalk(confDescriptor, talkId);
const { LL } = typesafeI18n()

const {toggleFavorite, toggleWatchLater} = useUserTalkNoteActions(
    eventId, talkId,
    talkNotes,
);

const theme = computed(() => {
    if(isRefDefined(detailedTalk)) {
        return {
            track: {
                color: detailedTalk.value.track.themeColor
            }
        }
    } else {
        return undefined;
    }
});
</script>

<style lang="scss" scoped>
  ion-header {
    ion-toolbar {
      &:before, &:after {
        position: absolute;
        content: '';
        z-index: 1;
      }

    }

    &.to-watch-later{
      .btnTalkAction._watchLater {
        --background: var(--voxxrin-event-theme-colors-secondary-hex);
        --background-activated: var(--voxxrin-event-theme-colors-secondary-hex);
        --color-activated: var(--app-white);
        --color: var(--app-white);
      }

      ion-toolbar {
        &:before {
          background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-secondary-rgb), 0.6) 30%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6) 80%) !important;
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
      padding: 8px 16px;
      border-radius: 16px;

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

    &-description {
      padding: var(--app-gutters);

      ion-text {
        line-height: 1.6;
      }

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

          ion-avatar {
            max-height: 64px;
            min-height: 64px;
            min-width: 64px;
            max-width: 64px;
            margin-top: 0;
            margin-right: var(--app-gutters);
            border: 2px solid var(--app-primary);
          }

          .speakerInfo {
            display: flex;
            flex-direction: column;

            &-name {
              display: flex;
              flex-direction: column;
              margin-bottom: 8px;
              font-weight: bold;
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

  .slotSelectorDropdown {
    ion-item {
      --padding-start: 0;
      --inner-padding-start: 12px;

      @for $i from 0 through 1000 {
        animation: slide-top 140ms cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        animation-timing-function: ease-in-out;

        &:nth-child(#{$i}) {
          animation-delay: $i * calc(80ms / 6);
        }
      }

      &._isActive {
        font-weight: bold;
      }

      &:last-child {
        --inner-border-width: 0;
      }
    }
  }

  .navigationBar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    bottom: 24px;
    height: 54px;
    width: calc(100vw - 34px);
    padding: 0 4px;
    margin: 0 16px;
    border-radius: 54px;
    background: var(--app-primary);
    box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
    animation: slide-in-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;

    &-previous, &-next {
      display: flex;
      align-items: center;
      --inner-padding-end: 16px;
      font-weight: 600;
      color: var(--app-white);
      font-size: 12px;

      ion-icon {
        font-size: 38px;
      }

      .btnNavLabel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: left;
        font-size: 13px;
        padding: 0 2px;
        font-weight: bold;

        small {
          opacity: 0.5;
        }
      }
    }

    &-previous  {
      ion-button {
        --padding-end: 16px;
      }
      .btnNavLabel {align-items: start;}
    }

    &-next  {
      ion-button {
        --padding-start: 16px;
      }
      .btnNavLabel {align-items: end;}
    }

    .currentSlot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .slotSelector {
        height: 44px;
        --padding-bottom: 16px;

        ion-text {
          display: flex;
          flex-direction: row;
          align-items: center;
          column-gap: 8px;
          color: var(--app-white);
          font-weight: bold;
          letter-spacing: -1px;
        }
      }

      .bulletsList {
        position: absolute;
        bottom: 8px;
        display: flex;
        flex-direction: row;
        column-gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;

        &-item {
          height: 10px;
          width: 10px;
          border-radius: 12px;
          border: 1px solid var(--app-white);
          transition: 240ms ease-in-out;

          &._isActive {
            transition: 240ms ease-in-out;
            transform: scale(1.2);
            background-color: var(--app-white);
          }
        }
      }
    }
  }
</style>
