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

    <slot />

    <h1 class="talkDetails-title"
        :class="{'_hasTalkLand' : talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1}">
      <ion-badge v-if="talkLang && confDescriptor.features.hideLanguages.indexOf(talkLang.id.value)===-1"
                 :style="{ '--background': talkLang.themeColor }"
                 class="talkLang">
        {{talkLang.label}}
      </ion-badge>
      {{talk.title}}
    </h1>
    <div class="talkDetails-infos">
      <div class="talkDetails-infos-listTrack">
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
}
</style>
