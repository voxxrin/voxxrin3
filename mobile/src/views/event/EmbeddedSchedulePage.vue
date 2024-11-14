<template>
  <ion-page v-themed-event-styles="confDescriptor">
    <schedule-page :hide-header="true" :hide-watch-later="true" :emit-event-on-talk-clicked="true" @talk-clicked="openTalk"></schedule-page>
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
import {IonFooter, useIonRouter} from "@ionic/vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {
  getResolvedEventRootPath,
  getResolvedEventRootPathFromSpacedEventIdRef,
  useCurrentSpaceEventIdRef
} from "@/services/Spaces";
import {computed} from "vue";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";

const appBaseUrl = import.meta.env.VITE_WHITE_LABEL_PUBLIC_URL;
const appBaseUrlWithoutTrailingSlash = appBaseUrl.substring(0, appBaseUrl.length - (appBaseUrl[appBaseUrl.length-1]==='/'?1:0));

const spacedEventIdRef = useCurrentSpaceEventIdRef()
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);

const fullScheduleUrl = computed(() => {
  return `${appBaseUrlWithoutTrailingSlash}${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}`
})

const { LL } = typesafeI18n()
const spaceEventIdRef = useCurrentSpaceEventIdRef();
const router = useIonRouter();

const openTalk = (talk: VoxxrinTalk) => {
  router.push(`${getResolvedEventRootPath(spaceEventIdRef.value.eventId, spaceEventIdRef.value.spaceToken)}/talks/${talk.id.value}/details`)
}
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
