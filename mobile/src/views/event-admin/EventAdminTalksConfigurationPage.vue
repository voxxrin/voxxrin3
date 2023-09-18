<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <div class="viewsHeader">
            <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                        @click="triggerTabbedPageExitOrNavigate(`/event-selector`)">
              <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
            </ion-button>
            <ion-title class="stickyHeader-title" slot="start">Talks configuration</ion-title>
          </div>

          <div class="viewsSubHeader">
            <div class="viewsSubHeader-title">{{ confDescriptor?.headingTitle }}</div>
            <current-event-status :conf-descriptor="confDescriptor"></current-event-status>
          </div>
        </ion-toolbar>
        <img :src="confDescriptor?.backgroundUrl">
      </ion-header>

      <div v-if="confDescriptorRef && talks.length" class="sectionContainer">
        <div class="talkConfigItem" :class="{'_editMode': true}" v-for="(talk, index) in talks" :key="talk.id.value">
          <ion-row class="talkConfigItem-head" v-if="true">
            <ion-col size="auto" class="starNumber">
              <ion-icon src="/assets/icons/solid/video.svg"></ion-icon>
            </ion-col>
            <ion-col>
              <ion-input fill="outline" class="custom" placeholder="Enter URL"></ion-input>
            </ion-col>
          </ion-row>
          <schedule-talk :conf-descriptor="confDescriptorRef" :is-highlighted="() => false" :talk="talk">
            <template #footer-actions="{ talk, userTalkHook }">
               <span class="talkConfigStateIndicator">
                    <ion-icon class="talkConfigStateIndicator-check" src="/assets/icons/solid/settings-cog-check.svg"></ion-icon>
                    <ion-icon src="/assets/icons/solid/link.svg" v-if="true"></ion-icon>
                    <ion-icon src="/assets/icons/solid/bell.svg" v-if="false"></ion-icon>
                </span>
              <talk-watch-later-button :user-talk-notes="userTalkHook" :conf-descriptor="confDescriptor"></talk-watch-later-button>
            </template>
          </schedule-talk>
          <div class="talkConfigItem-actions" v-if="true">
            <ion-button class="ion-no-padding" shape="round" expand="full">
              <div class="btnHasHelp">
                <span class="btnHasHelp-label">Send recording notification <small>last send : 00/00/0000 - 00h00</small></span>
                <ion-icon src="/assets/icons/solid/bell.svg" slot="end"></ion-icon>
              </div>
            </ion-button>
            <ion-button class="ion-no-padding" shape="round" fill="outline" expand="full">
              <div class="btnHasHelp">
                <span class="btnHasHelp-label">Share token link</span>
                <ion-icon src="/assets/icons/solid/share.svg" slot="end"></ion-icon>
              </div>
            </ion-button>
          </div>
          <div class="talkConfigItem-footer">
            <ion-button shape="round" expand="full" size="default"  v-if="true">
              Save configuration talk
              <ion-icon src="/assets/icons/solid/save.svg" slot="end"></ion-icon>
            </ion-button>
          </div>
        </div>
        <div class="talkConfigItem" :class="{'_editMode': false}" v-for="(talk, index) in talks" :key="talk.id.value">
          <ion-row class="talkConfigItem-head" v-if="false">
            <ion-col size="auto" class="starNumber">
              <ion-icon src="/assets/icons/solid/video.svg"></ion-icon>
            </ion-col>
            <ion-col>
              <ion-input fill="outline" class="custom" placeholder="Enter URL"></ion-input>
            </ion-col>
          </ion-row>
          <schedule-talk :conf-descriptor="confDescriptorRef" :is-highlighted="() => false" :talk="talk">
            <template #footer-actions="{ talk, userTalkHook }">
               <span class="talkConfigStateIndicator">
                    <ion-icon class="talkConfigStateIndicator-check" src="/assets/icons/solid/settings-cog-check.svg"></ion-icon>
                    <ion-icon src="/assets/icons/solid/link.svg" v-if="true"></ion-icon>
                    <ion-icon src="/assets/icons/solid/bell.svg" v-if="true"></ion-icon>
                </span>
              <talk-watch-later-button :user-talk-notes="userTalkHook" :conf-descriptor="confDescriptor"></talk-watch-later-button>
            </template>
          </schedule-talk>
          <div class="talkConfigItem-actions" v-if="false">
            <ion-button class="ion-no-padding" shape="round" expand="full">
              <div class="btnHasHelp">
                <span class="btnHasHelp-label">Send recording notification <small>last send : 00/00/0000 - 00h00</small></span>
                <ion-icon src="/assets/icons/solid/bell.svg" slot="end"></ion-icon>
              </div>
            </ion-button>
            <ion-button class="ion-no-padding" shape="round" fill="outline" expand="full">
              <div class="btnHasHelp">
                <span class="btnHasHelp-label">Share token link</span>
                <ion-icon src="/assets/icons/solid/share.svg" slot="end"></ion-icon>
              </div>
            </ion-button>
          </div>
          <div class="talkConfigItem-footer">
            <ion-button shape="round" expand="full" size="default" v-if="true">
              Edit talk configuration
              <ion-icon src="/assets/icons/solid/edit-pen-2.svg" slot="end"></ion-icon>
            </ion-button>

            <ion-button shape="round" expand="full" size="default" v-if="false">
              Save configuration talk
              <ion-icon src="/assets/icons/solid/save.svg" slot="end"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button>
          <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-button class="ion-no-padding" shape="round" expand="full">
            <div class="btnHasHelp">
              <span class="btnHasHelp-label">Download CSV file <small>for every talk (CFP) id</small></span>
              <ion-icon src="/assets/icons/solid/file.svg" slot="end"></ion-icon>
            </div>
          </ion-button>
          <ion-button class="ion-no-padding" shape="round" expand="full">
            <div class="btnHasHelp">
              <span class="btnHasHelp-label">Push notifications  <small>having a recording link provided</small></span>
              <ion-icon src="/assets/icons/solid/bell.svg" slot="end"></ion-icon>
            </div>
          </ion-button>
          <ion-button class="ion-no-padding" shape="round" expand="full">
            <div class="btnHasHelp">
              <span class="btnHasHelp-label">Automatic recording link</span>
              <ion-icon src="/assets/icons/solid/video.svg" slot="end"></ion-icon>
            </div>
          </ion-button>
        </ion-fab-list>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter} from "@ionic/vue";
import {useRoute} from "vue-router";
import {computed, ref, unref} from "vue";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {useSchedule} from "@/state/useSchedule";
import {VoxxrinScheduleTalksTimeSlot} from "@/models/VoxxrinSchedule";
import CurrentEventStatus from "@/components/events/CurrentEventStatus.vue";
import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
import TalkSelectForFeedback from "@/components/talk-card/TalkSelectForFeedback.vue";

const ionRouter = useIonRouter();
const route = useRoute()

const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {conferenceDescriptor: confDescriptorRef} = useSharedConferenceDescriptor(eventId);
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const {triggerTabbedPageNavigate, triggerTabbedPageExitOrNavigate} = useTabbedPageNav()

const selectedDayId = computed(() => {
  const confDescriptor = unref(confDescriptorRef)
  if(!confDescriptor) {
    return undefined;
  }

  return confDescriptor.days[0].id;
})

const { schedule: currentScheduleRef } = useSchedule(confDescriptorRef, selectedDayId);
const talks = computed(() => {
  const currentSchedule = unref(currentScheduleRef);
  if(!currentSchedule) {
    return [];
  }

  const firstTalksTimeslot = currentSchedule.timeSlots.find(ts => ts.type === 'talks' && ts.talks.length>0) as VoxxrinScheduleTalksTimeSlot|undefined;
  if(!firstTalksTimeslot) {
    return [];
  }

  return firstTalksTimeslot.talks;
})

</script>

<style lang="scss" scoped>
  ion-header {
    img {
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      height: 100%;
      width: 100%;
      z-index: -1;
      object-fit: cover;
    }

    .btnUser {
      height: 48px;
      width: 48px;
      --padding-start: 0;
      --padding-end: 0;
      font-size: 18px;
      --background: rgba(var(--app-white-transparent));
      --border-color: rgba(var(--app-white-transparent));
      --border-width: 1px;

      :deep(ion-icon) {
        color: white;
      }
    }
  }

  ion-toolbar {
    position: relative;
    --background: linear-gradient(0deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4802) 0%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.98) 52.84%);
    z-index: 1;

    ion-title {
      position: relative;
      padding-inline: 12px;
      text-align: left;
    }

    .viewsHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      font-weight: bold;
      color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
    }

    .viewsSubHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 0;
      font-weight: bold;

      &-title {
        color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
        font-weight: bold;
        font-size: calc(28px + 8 * (100vw - 320px) / 1024)
      }
    }
  }

  .talkConfigItem {
    margin-bottom: 16px;
    border-radius: 16px;
    background: transparent;

    @media (prefers-color-scheme: dark) {
      background: var(--app-medium-contrast-contrast);
      border: 1px solid var(--app-beige-line);
    }

    ion-card {
      margin: 0;
    }

    &._editMode {
        background: var(--app-beige-medium);
        border: 1px solid var(--app-beige-line);

      @media (prefers-color-scheme: dark) {
        background: var(--app-light-contrast-contrast);
        border: 1px solid var(--app-beige-line);
      }

        ion-card {
          margin: 12px var(--app-gutters) 0;
        }

      .talkConfigItem-footer {
        top: inherit;
        margin: 0;
        padding: 16px;
        background-color: var(--app-beige-line);

        ion-button {
          --border-radius: 54px;
          --background: var(--voxxrin-event-theme-colors-primary-hex);
        }
      }
    }

    &-head {
      display: flex;
      align-items: center;
      flex-direction: row;
      padding: 12px 12px 0 12px;

      ion-icon {
        font-size: 28px;
      }
    }

    &-actions {
      padding: 12px;
      display: flex;
      flex-direction: column;
    }

    &-footer {
      position: relative;
      top: -6px;
      margin: 0 12px;
      border-radius: 0 0 16px 16px;
      background-color: var(--voxxrin-event-theme-colors-primary-hex);


      ion-button {
        --background: transparent;
        --box-shadow: none;
        --border-radius: 0;
      }
    }
  }

  .talkConfigStateIndicator {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-items: flex-end;
    margin: 12px 8px;
    padding: 4px 8px 4px 34px;
    background-color: var(--app-voxxrin);
    border-radius: 54px;

    &-check {
      position: absolute;
      left: 4px;
      padding-right: 4px;
      border-right: 1px solid var(--app-white);
      opacity: 0.8;
    }

    ion-icon {
      color: var(--app-white);
      font-size: 22px;
    }
  }

  ion-fab-list {
    align-items: inherit;
    right: 0;

    ion-button {
      @for $i from 0 through 1000 {
        animation: slide-left 140ms cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        animation-timing-function: ease-in-out;

        &:nth-child(#{$i}) {
          animation-delay: $i * calc(80ms / 6);
        }
      }
    }
  }
</style>
