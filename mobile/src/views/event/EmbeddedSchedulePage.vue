<template>
  <ion-page :style="{
      '--voxxrin-event-background-url': `url('${confDescriptor?.backgroundUrl}')`,
      '--voxxrin-event-logo-url': `url('${confDescriptor?.logoUrl}')`,
      '--voxxrin-event-theme-colors-primary-hex': confDescriptor?.theming.colors.primaryHex,
      '--voxxrin-event-theme-colors-primary-rgb': confDescriptor?.theming.colors.primaryRGB,
      '--voxxrin-event-theme-colors-primary-contrast-hex': confDescriptor?.theming.colors.primaryContrastHex,
      '--voxxrin-event-theme-colors-primary-contrast-rgb': confDescriptor?.theming.colors.primaryContrastRGB,
      '--voxxrin-event-theme-colors-secondary-hex': confDescriptor?.theming.colors.secondaryHex,
      '--voxxrin-event-theme-colors-secondary-rgb': confDescriptor?.theming.colors.secondaryRGB,
      '--voxxrin-event-theme-colors-secondary-contrast-hex': confDescriptor?.theming.colors.secondaryContrastHex,
      '--voxxrin-event-theme-colors-secondary-contrast-rgb': confDescriptor?.theming.colors.secondaryContrastRGB,
      '--voxxrin-event-theme-colors-tertiary-hex': confDescriptor?.theming.colors.tertiaryHex,
      '--voxxrin-event-theme-colors-tertiary-rgb': confDescriptor?.theming.colors.tertiaryRGB,
      '--voxxrin-event-theme-colors-tertiary-contrast-hex': confDescriptor?.theming.colors.tertiaryContrastHex,
      '--voxxrin-event-theme-colors-tertiary-contrast-rgb': confDescriptor?.theming.colors.tertiaryContrastRGB,
  }">
    <schedule-page :hide-header="true"></schedule-page>
    <ion-footer>
      <em>
        {{ LL.Open_full_version_of_the_schedule() }}
        <strong><a :href="`${appBaseUrlWithoutTrailingSlash}/events/${eventId.value}`" target="_blank">
          {{ LL.Here() }}
        </a></strong>
      </em>
    </ion-footer>
  </ion-page>
</template>
<script setup lang="ts">
import SchedulePage from "@/views/event/SchedulePage.vue";
import {IonFooter} from "@ionic/vue";
import {useRoute} from "vue-router";
import {ref} from "vue";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";

const appBaseUrl = import.meta.env.VITE_WHITE_LABEL_PUBLIC_URL;
const appBaseUrlWithoutTrailingSlash = appBaseUrl.substring(0, appBaseUrl.length - (appBaseUrl[appBaseUrl.length-1]==='/'?1:0));

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

</script>
<style scoped lang="scss">
ion-footer {
  padding: 5px 10px;
  position: absolute;
  bottom: 0px;
  background-color: var(--app-background);

  a {
    color: var(--app-voxxrin)
  }
}
</style>
