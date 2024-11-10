<template>
  <ion-page>
    <ion-tabs ref="$tabs" v-if="confDescriptor" v-themed-event-styles="confDescriptor">
      <ion-router-outlet></ion-router-outlet>
      <event-tabs :tabs="tabs" :spaced-event-id="spacedEventIdRef"></event-tabs>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {IonRouterOutlet, IonTabs,} from '@ionic/vue';
import {getRouteParamsValue, managedRef as ref} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import EventTabs from "@/components/events/EventTabs.vue";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

const spacedEventIdRef = useCurrentSpaceEventIdRef();
const route = useRoute();
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);

const { LL } = typesafeI18n()

const tabs = [{
  id: 'event-config', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/asOrganizer/${secretOrganizerToken.value}/config`, label: LL.value.Config(),
  icon: '/assets/icons/line/settings-cog-line.svg', selectedIcon: '/assets/icons/solid/settings-cog.svg',
}, {
  id: 'talks-config', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/asOrganizer/${secretOrganizerToken.value}/talks-config`, label: LL.value.Talks_Config(),
    icon: '/assets/icons/line/calendar-line.svg', selectedIcon: '/assets/icons/solid/calendar.svg',
}];
</script>

<style lang="scss" scoped>
</style>
