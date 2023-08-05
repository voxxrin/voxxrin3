<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor" :style="{
          '--voxxrin-event-background-url': `url('${confDescriptor.backgroundUrl}')`,
          '--voxxrin-event-logo-url': `url('${confDescriptor.logoUrl}')`,
          '--voxxrin-event-theme-colors-primary-hex': confDescriptor.theming.colors.primaryHex,
          '--voxxrin-event-theme-colors-primary-rgb': confDescriptor.theming.colors.primaryRGB,
          '--voxxrin-event-theme-colors-primary-contrast-hex': confDescriptor.theming.colors.primaryContrastHex,
          '--voxxrin-event-theme-colors-primary-contrast-rgb': confDescriptor.theming.colors.primaryContrastRGB,
          '--voxxrin-event-theme-colors-secondary-hex': confDescriptor.theming.colors.secondaryHex,
          '--voxxrin-event-theme-colors-secondary-rgb': confDescriptor.theming.colors.secondaryRGB,
          '--voxxrin-event-theme-colors-secondary-contrast-hex': confDescriptor.theming.colors.secondaryContrastHex,
          '--voxxrin-event-theme-colors-secondary-contrast-rgb': confDescriptor.theming.colors.secondaryContrastRGB,
          '--voxxrin-event-theme-colors-tertiary-hex': confDescriptor.theming.colors.tertiaryHex,
          '--voxxrin-event-theme-colors-tertiary-rgb': confDescriptor.theming.colors.tertiaryRGB,
          '--voxxrin-event-theme-colors-tertiary-contrast-hex': confDescriptor.theming.colors.tertiaryContrastHex,
          '--voxxrin-event-theme-colors-tertiary-contrast-rgb': confDescriptor.theming.colors.tertiaryContrastRGB,
    }">
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
            <ion-label class="favorite-btn-nb" v-if="eventTalkStats !== undefined">{{
                eventTalkStats.totalFavoritesCount
              }}</ion-label>
          </div>
        </ion-toolbar>
      </ion-header>

      <ion-text class="talkDetails">
        <ion-header class="subHeader">
          <div class="subHeader-schedule">
            <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" src="assets/icons/solid/clock.svg"></ion-icon>
            <ion-label v-if="timeslotLabel">
              <span class="slot-schedule-start">{{timeslotLabel.start}}</span>
              <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              <span class="slot-schedule-end">{{timeslotLabel.end}}</span>
            </ion-label>
          </div>
          <div class="subHeader-room" v-if="confDescriptor.features.roomsDisplayed">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
            {{talk?.room.title}}
          </div>
        </ion-header>


        <h1 class="talkDetails-title"
            :class="{'_hasTalkLand' : talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1}">
          <ion-badge v-if="talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1"
                     :style="{ '--background': talkLang.themeColor }"
                     class="talkLang">
            {{talkLang.label}}
          </ion-badge>
          {{talk?.title}}
        </h1>
        <div class="talkDetails-infos">
          <div class="talkDetails-infos-listTrack">
            <ion-badge v-if="confDescriptor.talkTracks.length > 1" class="trackBadge" :style="{
                '--background': talk?.track.themeColor
            }">{{talk?.track.title}}</ion-badge>
          </div>
          <ion-label :style="{ 'color': talk?.format.themeColor }">
            {{talk?.format.title}} ({{talk?.format.hmmDuration}})
          </ion-label>
        </div>
      </ion-text>

      <div class="talkDetails-tags" v-if="talk?.tags.length">
        <div class="talkDetails-tags-list">
          <ion-badge v-if="true" class="tagBadge" v-for="(tag) in talk?.tags" :key="tag">
            <ion-icon aria-hidden="true" src="assets/icons/solid/tag.svg"></ion-icon>
            {{tag}}
          </ion-badge>
        </div>
      </div>


      <div class="talkDetails-description">
        <vox-divider>
          {{ LL.Talk_summary() }}
        </vox-divider>
        <ion-text v-html="talk?.description">
        </ion-text>
      </div>

      <div class="talkDetails-speakers">
        <vox-divider>
          {{ LL.Speakers() }}
        </vox-divider>
        <ion-list class="talkDetails-speakers-list">
          <ion-item v-for="(speaker, index) in talk?.speakers" :key="speaker.id.value">
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
import {useUserTalkNotes} from "@/state/useUserTalkNotes";
import {TalkId} from "@/models/VoxxrinTalk";
import {useSharedEventTalk} from "@/state/useEventTalk";
import {computed, ref, unref, watch} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonBadge, IonAvatar, IonText, useIonRouter} from "@ionic/vue";
import {business} from "ionicons/icons";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {formatHourMinutes} from "@/models/DatesAndTime";
import {Temporal} from "temporal-polyfill";
import VoxDivider from "@/components/ui/VoxDivider.vue";
import {goBackOrNavigateTo} from "@/router";

const ionRouter = useIonRouter();
function closeAndNavigateBack() {
    goBackOrNavigateTo(ionRouter, `/events/${eventId.value.value}/schedule`, 0 /* talk details page is always opened through popups */)
}

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const talkId = computed(() => new TalkId(getRouteParamsValue(route, 'talkId')));
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const { eventTalkStats, talkNotes, toggleFavorite, toggleWatchLater} = useUserTalkNotes(eventId, talkId)
const { talkDetails: talk } = useSharedEventTalk(confDescriptor, talkId);
const { LL } = typesafeI18n()

const talkLang = computed(() => {
    const eventDescriptor = unref(confDescriptor),
        unreffedTalk = unref(talk);
    if(!eventDescriptor || !unreffedTalk) {
        return undefined;
    }

    return eventDescriptor.supportedTalkLanguages.find(lang => lang.id.isSameThan(unreffedTalk.language))
})

const timeslotLabel = computed(() => {
    if(isRefDefined(talk) && isRefDefined(confDescriptor)) {
        return {
            start: formatHourMinutes(Temporal.ZonedDateTime.from(`${talk.value.start}[${confDescriptor.value.timezone}]`)),
            end: formatHourMinutes(Temporal.ZonedDateTime.from(`${talk.value.end}[${confDescriptor.value.timezone}]`)),
        }
    } else {
        return undefined;
    }
})

const theme = computed(() => {
    if(isRefDefined(talk)) {
        return {
            track: {
                color: talk.value.track.themeColor
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
          background-image: url('assets/images/png/texture-favorited.png');
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

    &-title {
      font-weight: 900;
      padding: 0 var(--app-gutters);

      &._hasTalkLand { text-indent: 4px;}

      .talkLang {
        position: relative;
        float: left;
        top: 4px;
        font-size: 14px;
        height: 24px;
        width: 34px !important;
        text-indent: 0;
      }
    }

    &-infos {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 8px var(--app-gutters) var(--app-gutters) var(--app-gutters);

      .listTrack {
        display: inline-flex;
        flex-direction: row;
        row-gap: 12px;
      }

      ion-label {
        font-size: 14px;
        font-weight: 500;
      }
    }

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
            }
          }
        }
      }
    }
  }
</style>
