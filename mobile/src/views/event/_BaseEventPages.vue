<template>
  <ion-page>
    <event-tabs :tabs="tabs" :spaced-event-id="spacedEventIdRef"></event-tabs>
    <link v-for="customFontUrl in customFontUrls" :key="customFontUrl" rel="stylesheet" :href="customFontUrl" />
  </ion-page>
</template>

<script setup lang="ts">
import EventTabs from "@/components/events/EventTabs.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, toValue} from "vue";
import {areFeedbacksEnabled} from "@/models/VoxxrinConferenceDescriptor";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";
import {match} from "ts-pattern";

const spacedEventIdRef = useCurrentSpaceEventIdRef()
const {conferenceDescriptor: confDescriptorRef} = useSharedConferenceDescriptor(spacedEventIdRef);

const { LL } = typesafeI18n()

const tabs = computed(() => {
    const confDescriptor = toValue(confDescriptorRef);
    return ([] as Array<{id: string, label: string, url: string, icon: string, selectedIcon: string }>)
      .concat(confDescriptor?.features.skipShowingSchedule === true ? []:[{
        id: 'schedule', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/schedule`, label: LL.value.Schedule(),
        icon: '/assets/icons/line/calendar-line.svg',
        selectedIcon: '/assets/icons/solid/calendar.svg',
    }]).concat([{
      id: 'speakers', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/speakers`, label: LL.value.Speakers(),
      icon: '/assets/icons/line/megaphone-line.svg',
      selectedIcon: '/assets/icons/solid/megaphone.svg',
    }]).concat(confDescriptor && areFeedbacksEnabled(confDescriptor) ? [{
        id: 'feedbacks', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/feedbacks`, label: LL.value.Feedbacks(),
        icon: '/assets/icons/line/comments-2-line.svg',
        selectedIcon: '/assets/icons/solid/comments-2.svg',
    }]:[]).concat(confDescriptor?.features?.showInfosTab ? [{
        id: 'infos', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/infos`, label: LL.value.Infos(),
        icon: '/assets/icons/line/info-circle-line.svg',
        selectedIcon: '/assets/icons/solid/info-circle.svg',
    }]:[])
})

const customFontUrls = computed(() => {
  const confDescriptor = toValue(confDescriptorRef);
  return (confDescriptor?.theming?.customImportedFonts || []).map(customFontDescriptor => match(customFontDescriptor)
    .with({ provider: 'google-fonts' }, ({ family }) => `https://fonts.googleapis.com/css2?family=${family}&display=swap`)
    .exhaustive()
  )
})
</script>

<style lang="scss" scoped>
</style>
