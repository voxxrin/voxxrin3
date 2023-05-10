<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button v-for="(tab, index) in tabs" :key="index"
            :tab="tab.id" @click="(ev: Event) => tabClicked(tab, ev)" :href="tab.url">
          <ion-icon aria-hidden="true" :src="selectedTab === tab.id ? tab.selectedIcon : tab.icon"/>
          <ion-label>{{ tab.label }}</ion-label>
          <ion-ripple-effect type="unbounded"></ion-ripple-effect>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonRouterOutlet, useIonRouter,
} from '@ionic/vue';
import {ref} from "vue";
import {useRoute} from "vue-router";
import {getRouteParamsValue} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";

const router = useIonRouter();
const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')!));
const event = useCurrentConferenceDescriptor(eventId.value);

const { LL } = typesafeI18n()

const tabs = [{
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
}, {
  id: 'infos', url: `/events/${eventId.value.value}/infos`, label: LL.value.Infos(),
  icon: '/assets/icons/line/info-circle-line.svg',
  selectedIcon: '/assets/icons/solid/info-circle.svg',
}] as const;

const selectedTab = ref((tabs.find(t => t.url === route.fullPath) || tabs[0]).id);

function tabClicked(tab: typeof tabs[number], event: Event) {
    selectedTab.value = tab.id;
}
</script>
