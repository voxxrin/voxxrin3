
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" />

      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title slot="start" >Feedbacks</ion-title>
          <ion-button slot="end" shape="round" size="small">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <div class="infoMessage ion-text-center">
        <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-no-feedback.svg"></ion-icon>
        <span class="infoMessage-title">No feedback yet</span>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue} from "@/views/vue-utils";
  import {useRoute} from "vue-router";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {computed, ref} from "vue";

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: event} = useSharedConferenceDescriptor(eventId);
</script>
