<template>
  <ion-page>
    <event-tabs :tabs="tabs" :spaced-event-id="spacedEventIdRef"></event-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {getRouteParamsValue, managedRef as ref} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import EventTabs from "@/components/events/EventTabs.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TalkId} from "@/models/VoxxrinTalk";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

const spacedEventIdRef = useCurrentSpaceEventIdRef();
const route = useRoute();
const talkId = ref(new TalkId(getRouteParamsValue(route, 'talkId')));
const secretFeedbacksViewerToken = ref(getRouteParamsValue(route, 'secretFeedbacksViewerToken'));

const { LL } = typesafeI18n()

const tabs = [{
    id: 'details', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/talks/${talkId.value.value}/asFeedbackViewer/${secretFeedbacksViewerToken.value}/details`,
    label: LL.value.Talk_details(), icon: '/assets/icons/line/calendar-line.svg', selectedIcon: '/assets/icons/solid/calendar.svg',
}, {
    id: 'feedbacks', url: `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/talks/${talkId.value.value}/asFeedbackViewer/${secretFeedbacksViewerToken.value}/feedbacks`,
    label: LL.value.Feedbacks(), icon: '/assets/icons/line/comment-text-line.svg', selectedIcon: '/assets/icons/solid/comment-text.svg',
}];
</script>

<style lang="scss" scoped>
</style>
