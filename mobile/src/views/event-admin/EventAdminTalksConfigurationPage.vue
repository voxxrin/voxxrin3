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

      <div v-if="confDescriptorRef && talks.length">
        <schedule-talk v-for="(talk, index) in talks" :key="talk.id.value"
            :conf-descriptor="confDescriptorRef" :is-highlighted="() => false" :talk="talk"></schedule-talk>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter} from "@ionic/vue";
import {goBackOrNavigateTo} from "@/router";
import {useRoute} from "vue-router";
import {computed, ref, unref} from "vue";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {useSchedule} from "@/state/useSchedule";
import {VoxxrinScheduleTalksTimeSlot} from "@/models/VoxxrinSchedule";

const ionRouter = useIonRouter();
const route = useRoute()

const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {conferenceDescriptor: confDescriptorRef} = useSharedConferenceDescriptor(eventId);

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
</style>
