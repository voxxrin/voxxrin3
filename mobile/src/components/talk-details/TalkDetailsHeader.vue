<template>
  <ion-text class="talkDetails" v-if="talk">
    <ion-header class="subHeader">
      <div class="slot-date" v-if="timeslotLabel">
        <ion-icon aria-hidden="true" src="assets/icons/solid/calendar.svg"></ion-icon> {{timeslotLabel.date}}
      </div>
      <div class="slot-infos">
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
          {{talk.room.title}}
        </div>
      </div>
    </ion-header>

    <h1 class="talkDetails-title"
        :class="{'_hasTalkLand' : talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1}">
      <ion-badge v-if="talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1"
                 :style="{ '--background': talkLang.themeColor }"
                 class="talkLang">
        {{talkLang.label}}
      </ion-badge>
      <!-- TODO #57 - Add condition for badge closed caption caption -->
      <ion-badge v-if="false"
                 class="talkLang _deaf">
        <ion-icon src="/assets/icons/line/ear-deaf.svg"></ion-icon>CC
      </ion-badge>
      {{talk.title}}
    </h1>
    <div class="talkDetails-infos">
      <div class="talkDetails-infos-listTrack">
        <!-- TODO #57 - Add conditions level indicator and class _active -->
        <ion-badge v-if="true" class="levelBadge">
          <div class="levelIndicator">
            <svg v-if="true"
                 class="_lvl4"
                 xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 8">
              <path d="M18.9,7.8c-0.3,0-0.7-0.1-1-0.3l-5.7-3.8c-0.2-0.1-0.4-0.1-0.6,0L6.1,7.6C5.3,8.1,4.2,7.9,3.7,7.1C3.1,6.3,3.3,5.2,4.1,4.7l5.6-3.9c1.4-0.9,3.1-0.9,4.4,0l5.7,3.9c0.8,0.5,1,1.6,0.5,2.4C20,7.6,19.5,7.8,18.9,7.8z"/>
            </svg>
            <svg v-if="true"
                 xmlns="http://www.w3.org/2000/svg"
                 class="_lvl3"
                 viewBox="0 0 24 8">
              <path d="M18.9,7.8c-0.3,0-0.7-0.1-1-0.3l-5.7-3.8c-0.2-0.1-0.4-0.1-0.6,0L6.1,7.6C5.3,8.1,4.2,7.9,3.7,7.1C3.1,6.3,3.3,5.2,4.1,4.7l5.6-3.9c1.4-0.9,3.1-0.9,4.4,0l5.7,3.9c0.8,0.5,1,1.6,0.5,2.4C20,7.6,19.5,7.8,18.9,7.8z"/>
            </svg>
            <svg v-if="true"
                 :class="'_isActive'"
                 class="_lvl2"
                 xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 8">
              <path d="M18.9,7.8c-0.3,0-0.7-0.1-1-0.3l-5.7-3.8c-0.2-0.1-0.4-0.1-0.6,0L6.1,7.6C5.3,8.1,4.2,7.9,3.7,7.1C3.1,6.3,3.3,5.2,4.1,4.7l5.6-3.9c1.4-0.9,3.1-0.9,4.4,0l5.7,3.9c0.8,0.5,1,1.6,0.5,2.4C20,7.6,19.5,7.8,18.9,7.8z"/>
            </svg>
            <svg v-if="true"
                 :class="'_isActive'"
                 class="_lvl1"
                 xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 8">
              <path d="M18.9,7.8c-0.3,0-0.7-0.1-1-0.3l-5.7-3.8c-0.2-0.1-0.4-0.1-0.6,0L6.1,7.6C5.3,8.1,4.2,7.9,3.7,7.1C3.1,6.3,3.3,5.2,4.1,4.7l5.6-3.9c1.4-0.9,3.1-0.9,4.4,0l5.7,3.9c0.8,0.5,1,1.6,0.5,2.4C20,7.6,19.5,7.8,18.9,7.8z"/>
            </svg>
          </div>
          <label>Difficulty</label>
        </ion-badge>
        <ion-badge v-if="confDescriptor.talkTracks.length > 1" class="trackBadge" :style="{
                '--background': talk.track.themeColor
            }">
          <div class="trackBadge-content">
            <ion-icon src="/assets/icons/solid/tag.svg"></ion-icon> {{talk.track.title}}
          </div>
        </ion-badge>
      </div>
      <ion-label :style="{ 'color': talk.format.themeColor }">
        {{talk.format.title}} ({{talk.format.hmmDuration}})
      </ion-label>
    </div>
  </ion-text>

</template>

<script setup lang="ts">
import {IonBadge, IonText} from "@ionic/vue";
import {computed, PropType, unref} from "vue";
import {VoxxrinDetailedTalk} from "@/models/VoxxrinTalk";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {formatHourMinutes, weekDayMonthYearFormattedDate} from "@/models/DatesAndTime";
import {Temporal} from "temporal-polyfill";

const props = defineProps({
    talk: {
        required: true,
        type: Object as PropType<VoxxrinDetailedTalk>
    },
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
})

const timeslotLabel = computed(() => {
    if(props.talk && props.confDescriptor) {
        return {
            date: weekDayMonthYearFormattedDate(Temporal.ZonedDateTime.from(`${props.talk.start}[${props.confDescriptor.timezone}]`)),
            start: formatHourMinutes(Temporal.ZonedDateTime.from(`${props.talk.start}[${props.confDescriptor.timezone}]`)),
            end: formatHourMinutes(Temporal.ZonedDateTime.from(`${props.talk.end}[${props.confDescriptor.timezone}]`)),
        }
    } else {
        return undefined;
    }
})

const talkLang = computed(() => {
    const talk = props.talk;
    if(!talk) {
        return undefined;
    }

    return props.confDescriptor.supportedTalkLanguages.find(lang => lang.id.isSameThan(talk.language))
})
</script>

<style lang="scss" scoped>
.talkDetails {

  .subHeader {
    display: flex;
    flex-direction: column;
    padding: 0;

    .slot-date {
      display: flex;
      align-items: center;
      column-gap: 8px;
      background-color: var(--voxxrin-event-theme-colors-primary-hex);
      padding: 8px 16px;
      color: var(--app-white);
    }

    .slot-infos {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      padding: 8px 16px;
    }
  }

  &-title {
    font-weight: 900;
    padding: 0 var(--app-gutters);

    &._hasTalkLand { text-indent: 4px;}

    .talkLang {
      position: relative;
      display: flex;
      float: left;
      top: 4px;
      height: 24px;
      min-width: 34px;
      margin-right: 4px;
      padding-left: 8px;
      font-size: 14px;
      line-height: 1.1;
      border-radius: 12px 12px 12px 0;
      text-indent: 0;

      ion-icon {
        color: white;
        font-size: 14px;
        width: 14px;
        margin-right: -2px;
        margin-left: -2px;

        @media (prefers-color-scheme: dark) {
          color: var(--app-primary);
        }
      }

      &._deaf {
        background-color: var(--app-primary);

        @media (prefers-color-scheme: dark) {
          background: var(--app-white);
          color: var(--app-primary);
        }
      }
    }
  }

  &-infos {
    display: flex;
    flex-direction: row;
    align-items: top;
    justify-content: space-between;
    padding: 8px var(--app-gutters) var(--app-gutters) var(--app-gutters);

    &-listTrack {
      display: flex;
      flex: 1;
      flex-direction: row;
      flex-wrap: wrap;
      row-gap: 8px;
      column-gap: 8px;
    }

    ion-label {
      flex: 0 0 auto;
      padding-top: 4px;
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>
