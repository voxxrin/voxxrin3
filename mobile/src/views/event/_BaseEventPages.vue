<template>
  <ion-page>
    <event-tabs :tabs="tabs" :spaced-event-id="spacedEventIdRef"></event-tabs>
    <link v-for="googleFontUrl in confDescriptorRef?.theming.customGoogleFontFamilies || []" :key="googleFontUrl" rel="stylesheet" :href="`https://fonts.googleapis.com/css2?family=${googleFontUrl}&display=swap`" />
  </ion-page>
</template>

<script setup lang="ts">
import EventTabs from "@/components/events/EventTabs.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, toValue} from "vue";
import {areFeedbacksEnabled} from "@/models/VoxxrinConferenceDescriptor";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

const spacedEventIdRef = useCurrentSpaceEventIdRef()
const {conferenceDescriptor: confDescriptorRef} = useSharedConferenceDescriptor(spacedEventIdRef);

const { LL } = typesafeI18n()

const tabs = computed(() => {
    const confDescriptor = toValue(confDescriptorRef);
    return [{
        id: 'schedule', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/schedule`, label: LL.value.Schedule(),
        icon: '/assets/icons/line/calendar-line.svg',
        selectedIcon: '/assets/icons/solid/calendar.svg',
    }].concat(confDescriptor?.features.favoritesEnabled?[{
        id: 'favorites', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/favorites`, label: LL.value.Favorites(),
        icon: '/assets/icons/line/bookmark-line-favorite.svg',
        selectedIcon: '/assets/icons/solid/bookmark-favorite.svg',
    }]:[]).concat(confDescriptor && areFeedbacksEnabled(confDescriptor) ? [{
        id: 'feedbacks', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/feedbacks`, label: LL.value.Feedbacks(),
        icon: '/assets/icons/line/comments-2-line.svg',
        selectedIcon: '/assets/icons/solid/comments-2.svg',
    }]:[]).concat(confDescriptor?.features?.showInfosTab ? [{
        id: 'infos', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/infos`, label: LL.value.Infos(),
        icon: '/assets/icons/line/info-circle-line.svg',
        selectedIcon: '/assets/icons/solid/info-circle.svg',
    }]:[])
})
</script>

<style lang="scss" scoped>
</style>
