<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" back-btn-action="goBack" />
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title class="stickyHeader-title" slot="start" >Talk details</ion-title>
          <div class="watchLater">
            <ion-button class="btnTalk watch-later-btn" @click.stop="() => toggleWatchLater()">
              <ion-icon v-if="!talkNotes.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
              <ion-icon v-if="talkNotes.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
            </ion-button>
          </div>
          <div class="favorite">
            <ion-button class="btnTalk favorite-btn" @click.stop="() => toggleFavorite()">
              <ion-icon class="favorite-btn-icon" v-if="!talkNotes.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
              <ion-icon class="favorite-btn-icon" v-if="talkNotes.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
              <ion-label class="favorite-btn-nb" v-if="eventTalkStats.totalFavoritesCount !== undefined">{{
                  eventTalkStats.totalFavoritesCount
                }}</ion-label>
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-header>

      <ion-text>
        <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" src="assets/icons/solid/clock.svg"></ion-icon>
        <ion-label v-if="timeslotLabel">
          <span class="slot-schedule-start">{{timeslotLabel.start}}</span>
          <ion-icon class="slot-schedule-icon" aria-hidden="true" src="assets/icons/line/chevron-right-line.svg"></ion-icon>
          <span class="slot-schedule-end">{{timeslotLabel.end}}</span>
        </ion-label>
        <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
        {{talk?.room.title}}
        <hr/>
        <h3>{{talk?.title}}</h3>
        <ion-badge class="trackBadge" :style="{
            '--background': talk?.track.themeColor,
            '--color': talk?.track.themeColor
        }">{{talk?.track.title}}</ion-badge>
        <ion-label :style="{ 'color': talk?.format.themeColor }">
          {{talk?.format.title}} ({{talk?.format.duration}})
        </ion-label>
      </ion-text>
      <h5>{{ LL.Talk_summary() }}</h5>
      <ion-text v-html="talk?.description">
      </ion-text>
      <h5>{{ LL.Speakers() }}</h5>
      <ion-list>
        <ion-item v-for="(speaker, index) in talk?.speakers" :key="index">
          <ion-avatar>
            <img :src="speaker.photoUrl" />
          </ion-avatar>
          {{speaker.fullName}} <span v-if="speaker.companyName">({{speaker.companyName}})</span>
          <br/>
          <div v-html="speaker.speakerBio"></div>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue, isRefDefined} from "@/views/vue-utils";
import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {useUserTalkNotes} from "@/state/useUserTalkNotes";
import {DayId} from "@/models/VoxxrinDay";
import {TalkId} from "@/models/VoxxrinTalk";
import {useEventTalkStats} from "@/state/useEventTalkStats";
import {useEventTalk} from "@/state/useEventTalk";
import {getTimeslotLabel} from "@/models/VoxxrinSchedule";
import {computed, watch} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonBadge, IonAvatar, IonText} from "@ionic/vue";

const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
const dayId = new DayId(getRouteParamsValue(route, 'dayId')!);
const talkId = new TalkId(getRouteParamsValue(route, 'talkId')!);
const event = useCurrentConferenceDescriptor(eventId);

const { talkNotes, toggleFavorite, toggleWatchLater} = useUserTalkNotes(eventId, dayId, talkId)
const { eventTalkStats } = useEventTalkStats(eventId, dayId, talkId)
const { talk } = useEventTalk(eventId, dayId, talkId);
const { LL } = typesafeI18n()

const timeslotLabel = computed(() => {
    if(isRefDefined(talk)) {
        return getTimeslotLabel(talk.value.timeslot)
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
</style>
