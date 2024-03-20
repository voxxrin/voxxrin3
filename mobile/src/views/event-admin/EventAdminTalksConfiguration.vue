<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="triggerTabbedPageExitOrNavigate(`/event-selector`)"
                      :aria-label="LL.Previous_screen()">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">Event Talks Configuration</ion-title>
        </ion-toolbar>
      </ion-header>
      TODO: Event talks here...<br/>
      Basically, the same page as the regular schedule, except that we can perform different actions on every talks :
      <ul>
        <li>Allow to provide recording link manually</li>
        <li>Trigger recording PUSH notification</li>
        <li>Get (shareable) Feedbacks-viewer token link</li>
      </ul>

      At the general level (through a footer-action-button), we should be able to :
      <ul>
        <li>Trigger automatic recording link resolution from Youtube</li>
        <li>Trigger PUSH Notification on every talks having a recording link provided since latest PUSH notification trigger</li>
        <li>Download CSV file with every talk (CFP) id + shareable feedbacks-viewer token link, that could be shared by conference organizer to speakers</li>
      </ul>

      <ion-button @click="triggerTabbedPageNavigate(`/events/${eventId.value}/asOrganizer/${secretOrganizerToken}/talk-feedbacks/1`, 'forward', 'push')">
        Feedbacks for talk 1
      </ion-button>
      <ion-button @click="triggerTabbedPageNavigate(`/events/${eventId.value}/asOrganizer/${secretOrganizerToken}/talk-feedbacks/2`, 'forward', 'push')">
        Feedbacks for talk 2
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter} from "@ionic/vue";
import {useRoute} from "vue-router";
import {managedRef as ref} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";

const ionRouter = useIonRouter();
const route = useRoute()

const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {triggerTabbedPageNavigate, triggerTabbedPageExitOrNavigate} = useTabbedPageNav()

</script>

<style lang="scss" scoped>
</style>
