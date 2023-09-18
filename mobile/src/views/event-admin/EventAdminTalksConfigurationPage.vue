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
              <ion-input fill="outline" placeholder="Enter URL"></ion-input>
            </ion-col>
          </ion-row>
          <schedule-talk :conf-descriptor="confDescriptorRef" :is-highlighted="() => false" :talk="talk">
            <template #footer-actions="{ talk, userTalkHook }">

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
            <ion-button shape="round" color="primary" expand="full" size="default">
              Save configuration talk
              <ion-icon src="/assets/icons/solid/save.svg" slot="end"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>
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
    border-radius: 16px;
    background: var(--app-beige-medium);
    border: 1px solid var(--app-beige-line);

    @media (prefers-color-scheme: dark) {
      background: var(--app-medium-contrast-contrast);
      border: 1px solid var(--app-beige-line);
    }

    &._editMode {

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
      padding: 16px;
      border-radius: 0 0 16px 16px;
      background-color: var(--app-beige-line);
    }
  }
</style>
