<template>
  <ion-page>
    <ion-tabs ref="$tabs" v-if="confDescriptor" v-themed-event-styles="confDescriptor">
      <ion-router-outlet></ion-router-outlet>
      <event-tabs :tabs="tabs" :event-id="eventId"></event-tabs>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonTabs,
    IonRouterOutlet,
    useIonRouter,
} from '@ionic/vue';
import {managedRef as ref} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {getRouteParamsValue} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import EventTabs from "@/components/events/EventTabs.vue";

const router = useIonRouter();
const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

const tabs = [{
  id: 'event-config', url: `/events/${eventId.value.value}/asOrganizer/${secretOrganizerToken.value}/config`, label: LL.value.Config(),
  icon: '/assets/icons/line/settings-cog-line.svg', selectedIcon: '/assets/icons/solid/settings-cog.svg',
}, {
  id: 'talks-config', url: `/events/${eventId.value.value}/asOrganizer/${secretOrganizerToken.value}/talks-config`, label: LL.value.Talks_Config(),
    icon: '/assets/icons/line/calendar-line.svg', selectedIcon: '/assets/icons/solid/calendar.svg',
}];
</script>

<style lang="scss" scoped>
</style>
