<template>
  <ion-page>
    <event-tabs :tabs="tabs" :event-id="eventId"></event-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {managedRef as ref} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {getRouteParamsValue} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import EventTabs from "@/components/events/EventTabs.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {computed, toValue} from "vue";

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: confDescriptorRef} = useSharedConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

const tabs = computed(() => {
    const confDescriptor = toValue(confDescriptorRef);
    return [{
        id: 'schedule', url: `/events/${eventId.value.value}/schedule`, label: LL.value.Schedule(),
        icon: '/assets/icons/line/calendar-line.svg',
        selectedIcon: '/assets/icons/solid/calendar.svg',
    }, {
        id: 'favorites', url: `/events/${eventId.value.value}/favorites`, label: LL.value.Favorites(),
        icon: '/assets/icons/line/bookmark-line-favorite.svg',
        selectedIcon: '/assets/icons/solid/bookmark-favorite.svg',
    }, {
        id: 'feedbacks', url: `/events/${eventId.value.value}/feedbacks`, label: LL.value.Feedbacks(),
        icon: '/assets/icons/line/comments-2-line.svg',
        selectedIcon: '/assets/icons/solid/comments-2.svg',
    }].concat(confDescriptor?.features?.showInfosTab ? [{
        id: 'infos', url: `/events/${eventId.value.value}/infos`, label: LL.value.Infos(),
        icon: '/assets/icons/line/info-circle-line.svg',
        selectedIcon: '/assets/icons/solid/info-circle.svg',
    }]:[])
})
</script>

<style lang="scss" scoped>
</style>
