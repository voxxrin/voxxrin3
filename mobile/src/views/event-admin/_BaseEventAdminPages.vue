<template>
  <ion-page>
    <ion-tabs ref="$tabs" v-if="confDescriptor" :style="{
      '--voxxrin-event-background-url': `url('${confDescriptor.backgroundUrl}')`,
      '--voxxrin-event-logo-url': `url('${confDescriptor.logoUrl}')`,
      '--voxxrin-event-theme-colors-primary-hex': confDescriptor.theming.colors.primaryHex,
      '--voxxrin-event-theme-colors-primary-rgb': confDescriptor.theming.colors.primaryRGB,
      '--voxxrin-event-theme-colors-primary-contrast-hex': confDescriptor.theming.colors.primaryContrastHex,
      '--voxxrin-event-theme-colors-primary-contrast-rgb': confDescriptor.theming.colors.primaryContrastRGB,
      '--voxxrin-event-theme-colors-secondary-hex': confDescriptor.theming.colors.secondaryHex,
      '--voxxrin-event-theme-colors-secondary-rgb': confDescriptor.theming.colors.secondaryRGB,
      '--voxxrin-event-theme-colors-secondary-contrast-hex': confDescriptor.theming.colors.secondaryContrastHex,
      '--voxxrin-event-theme-colors-secondary-contrast-rgb': confDescriptor.theming.colors.secondaryContrastRGB,
      '--voxxrin-event-theme-colors-tertiary-hex': confDescriptor.theming.colors.tertiaryHex,
      '--voxxrin-event-theme-colors-tertiary-rgb': confDescriptor.theming.colors.tertiaryRGB,
      '--voxxrin-event-theme-colors-tertiary-contrast-hex': confDescriptor.theming.colors.tertiaryContrastHex,
      '--voxxrin-event-theme-colors-tertiary-contrast-rgb': confDescriptor.theming.colors.tertiaryContrastRGB,
  }">
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
import {ref} from "vue";
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
