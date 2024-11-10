<template>
  <ion-page v-themed-event-styles="confDescriptor">
    <schedule-page :hide-header="true" :hide-watch-later="true"></schedule-page>
    <ion-footer>
      <em>
        {{ LL.Open_full_version_of_the_schedule() }}
        <strong><a :href="fullScheduleUrl" target="_blank">
          {{ LL.Here() }}
        </a></strong>
      </em>
    </ion-footer>
  </ion-page>
</template>
<script setup lang="ts">
import {SchedulePage} from "@/router/preloaded-pages";
import {IonFooter} from "@ionic/vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";
import {computed} from "vue";

const appBaseUrl = import.meta.env.VITE_WHITE_LABEL_PUBLIC_URL;
const appBaseUrlWithoutTrailingSlash = appBaseUrl.substring(0, appBaseUrl.length - (appBaseUrl[appBaseUrl.length-1]==='/'?1:0));

const spacedEventIdRef = useCurrentSpaceEventIdRef()
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);

const fullScheduleUrl = computed(() => {
  return `${appBaseUrlWithoutTrailingSlash}/${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}`
})

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
