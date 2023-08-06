<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="triggerTabbedPageExitOrNavigate(`/event-selector`)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">Event Talks Configuration</ion-title>
        </ion-toolbar>
      </ion-header>
      TODO: Event talks here...
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
import {goBackOrNavigateTo} from "@/router";
import {useRoute} from "vue-router";
import {ref} from "vue";
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
