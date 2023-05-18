<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="event" :style="{
          '--voxxrin-event-background-url': `url('${event.backgroundUrl}')`,
          '--voxxrin-event-logo-url': `url('${event.logoUrl}')`,
          '--voxxrin-event-theme-colors-primary-hex': event.theming.colors.primaryHex,
          '--voxxrin-event-theme-colors-primary-rgb': event.theming.colors.primaryRGB,
          '--voxxrin-event-theme-colors-primary-contrast-hex': event.theming.colors.primaryContrastHex,
          '--voxxrin-event-theme-colors-primary-contrast-rgb': event.theming.colors.primaryContrastRGB,
          '--voxxrin-event-theme-colors-secondary-hex': event.theming.colors.secondaryHex,
          '--voxxrin-event-theme-colors-secondary-rgb': event.theming.colors.secondaryRGB,
          '--voxxrin-event-theme-colors-secondary-contrast-hex': event.theming.colors.secondaryContrastHex,
          '--voxxrin-event-theme-colors-secondary-contrast-rgb': event.theming.colors.secondaryContrastRGB,
          '--voxxrin-event-theme-colors-tertiary-hex': event.theming.colors.tertiaryHex,
          '--voxxrin-event-theme-colors-tertiary-rgb': event.theming.colors.tertiaryRGB,
          '--voxxrin-event-theme-colors-tertiary-contrast-hex': event.theming.colors.tertiaryContrastHex,
          '--voxxrin-event-theme-colors-tertiary-contrast-rgb': event.theming.colors.tertiaryContrastRGB,
    }">
      <ion-header class="stickyHeader" :class="{ 'is-favorited': talkNotes.isFavorite, 'to-watch-later': talkNotes.watchLater }">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="$router.back()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start" >Talk details</ion-title>
          <ion-button class="btnTalkAction _watchLater" slot="end" shape="round" fill="outline"  @click.stop="() => toggleWatchLater()">
            <ion-icon v-if="!talkNotes.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
            <ion-icon v-if="talkNotes.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
          </ion-button>
          <div class="favoriteGroup" slot="end">
            <ion-button class="btnTalkAction _favorite" shape="round" fill="outline" @click.stop="() => toggleFavorite()">
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
        <ion-header class="talkDetails-subHeader">
          <div class="talkDetails-subHeader-schedule">
            <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" src="assets/icons/solid/clock.svg"></ion-icon>
            <ion-label v-if="timeslotLabel">
              <span class="slot-schedule-start">{{timeslotLabel.start}}</span>
              <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
              <span class="slot-schedule-end">{{timeslotLabel.end}}</span>
            </ion-label>
          </div>
          <div class="talkDetails-subHeader-room">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
            {{talk?.room.title}}
          </div>
        </ion-header>


        <h1 class="talkDetails-title">{{talk?.title}}</h1>
        <div class="talkDetails-infos">
          <div class="talkDetails-infos-listTrack">
          <ion-badge class="trackBadge" :style="{
              '--background': talk?.track.themeColor
          }">{{talk?.track.title}}</ion-badge>
          </div>
          <ion-label :style="{ 'color': talk?.format.themeColor }">
            {{talk?.format.title}} ({{talk?.format.hmmDuration}})
          </ion-label>
        </div>
      </ion-text>

      <div class="talkDetails-description">
        <div class="divider">
          <span class="titleDivider">{{ LL.Talk_summary() }}</span>
          <span class="divider-separator"></span>
        </div>
        <ion-text v-html="talk?.description">
        </ion-text>
      </div>

      <div class="talkDetails-speakers">
        <div class="divider">
          <span class="titleDivider">{{ LL.Speakers() }}</span>
          <span class="divider-separator"></span>
        </div>
        <ion-list class="talkDetails-speakers-list">
          <ion-item v-for="(speaker, index) in talk?.speakers" :key="index">
            <ion-avatar>
              <img :src="speaker.photoUrl" />
            </ion-avatar>
            <div class="speakerInfo">
              <div class="speakerInfo-name">
                {{speaker.fullName}}
                <span class="speakerInfo-company" v-if="speaker.companyName">
                     <ion-icon aria-hidden="true" :icon="business"></ion-icon>
                  ({{speaker.companyName}})
                </span>
              </div>
              <div class="speakerInfo-description">
                <div v-html="speaker.speakerBio"></div>
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
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {useEventTalk} from "@/state/useEventTalk";
import {computed, watch} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonBadge, IonAvatar, IonText} from "@ionic/vue";
import {business} from "ionicons/icons";
import {useConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {formatHourMinutes} from "@/models/DatesAndTime";
import {Temporal} from "temporal-polyfill";

const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
const dayId = new DayId(getRouteParamsValue(route, 'dayId')!);
const talkId = new TalkId(getRouteParamsValue(route, 'talkId')!);
const {conferenceDescriptor: event} = useConferenceDescriptor(eventId);

const { eventTalkStats, talkNotes, toggleFavorite, toggleWatchLater} = useUserTalkNotes(eventId, dayId, talkId)
const { talkDetails: talk } = useEventTalk(event, talkId);
const { LL } = typesafeI18n()

const timeslotLabel = computed(() => {
    if(isRefDefined(talk) && isRefDefined(event)) {
        return {
            start: formatHourMinutes(Temporal.ZonedDateTime.from(`${talk.value.start}[${event.value.timezone}]`)),
            end: formatHourMinutes(Temporal.ZonedDateTime.from(`${talk.value.end}[${event.value.timezone}]`)),
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
  .talkDetails {

    &-subHeader {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      background-color: var(--app-beige-line);
      padding: var(--app-gutters);
      z-index: 0;

      @media (prefers-color-scheme: dark) {
        background-color: var(--app-light-contrast);
      }

      &-schedule, &-room {
        display: flex;
        align-items: center;
        column-gap: 4px;
        font-weight: 600;
        color: var(--app-grey-dark);

        @media (prefers-color-scheme: dark) {
          color: var(--app-grey-light);
        }

        ion-label {
          display: flex;
          align-items: center;
        }

        .slot-schedule-icon {
          width: 16px;
          font-size: 16px;
          opacity: 0.4;
        }

        ion-icon {
          color: var(--app-primary-shade);

          @media (prefers-color-scheme: dark) {
            color: var(--app-white);
          }
        }
      }
    }

    &-title {
      font-weight: 900;
      padding: 0 var(--app-gutters);
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

  .divider {
    display: flex;
    flex-direction: row;
    align-items: center;

    .titleDivider {
      font-weight: bold;
      color: var(--app-beige-dark);

      @media (prefers-color-scheme: dark) {
        opacity: 0.8;
      }
    }

    .divider-separator {
      display: block;
      height: 1px;
      width: 100%;
      margin-left: 16px;
      background-color: var(--app-beige-line);
      flex: 1;

      @media (prefers-color-scheme: dark) {
        background-color: var(--app-line-contrast);
      }
    }
  }
</style>
