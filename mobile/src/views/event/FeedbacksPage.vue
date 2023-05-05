
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="event" :event="event" />

      <day-selector
          :selected="currentlySelectedDay"
          :days="currentConferenceDescriptor?.days || []"
          @day-selected="(day) => changeDayTo(day)">
      </day-selector>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
  import CurrentEventHeader from "@/components/CurrentEventHeader.vue";
  import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue} from "@/views/vue-utils";
  import {useRoute} from "vue-router";

  const route = useRoute();
  const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
  const event = useCurrentConferenceDescriptor(eventId);
</script>
