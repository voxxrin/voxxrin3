<template>
  <ion-page>
    <ion-tabs ref="$tabs" v-if="event" :style="{
      '--voxxrin-event-background-url': `url('${event.backgroundUrl}')`,
      '--voxxrin-event-logo-url': `url('${event.logoUrl}')`,
      '--voxxrin-event-theme-colors-primary-hex': event.theming.colors.primaryHex,
      '--voxxrin-event-theme-colors-primary-rgb': event.theming.colors.primaryRGB,
      '--voxxrin-event-theme-colors-primary-contrast-hex': event.theming.colors.primaryContrastHex,
      '--voxxrin-event-theme-colors-primary-contrast-rgb': event.theming.colors.primaryContrastRGB,
      '--voxxrin-event-theme-colors-secondary-hex': event.theming.colors.secondaryHex,
      '--voxxrin-event-theme-colors-secondary-rgb': event.theming.colors.secondaryRGB,
      '--voxxrin-event-theme-colors-secondary-contrast-hex': event.theming.colors.secondaryContrastHex,
      '--voxxrin-event-theme-colors-secondary-contrast-rgb': event.theming.colors.secondaryContrastRGB,
      '--voxxrin-event-theme-colors-tertiary-hex': event.theming.colors.tertiaryHex,
      '--voxxrin-event-theme-colors-tertiary-rgb': event.theming.colors.tertiaryRGB,
      '--voxxrin-event-theme-colors-tertiary-contrast-hex': event.theming.colors.tertiaryContrastHex,
      '--voxxrin-event-theme-colors-tertiary-contrast-rgb': event.theming.colors.tertiaryContrastRGB,
  }">
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
    IonRouterOutlet,
    useIonRouter,
} from '@ionic/vue';
import {computed, ref} from "vue";
import {useRoute} from "vue-router";
import {getRouteParamsValue} from "@/views/vue-utils";
import {EventId} from "@/models/VoxxrinEvent";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import {useConferenceDescriptor} from "@/state/useConferenceDescriptor";

const router = useIonRouter();
const route = useRoute();
const eventId = computed(() => new EventId(getRouteParamsValue(route, 'eventId')));
const {conferenceDescriptor: event} = useConferenceDescriptor(eventId);

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

const { registerTabbedPageNavListeners } = useTabbedPageNav();
registerTabbedPageNavListeners();
</script>

<style lang="scss" scoped>
ion-tab-bar {
  box-shadow: 0px -6px 28px rgba(0, 0, 0, 0.24);

  ion-tab-button {
    --ripple-color: var(--voxxrin-event-theme-colors-primary-hex);
    color: var(--app-primary);

    @media (prefers-color-scheme: dark) {
      --background: var(--app-dark-contrast);
      color: var(--app-white);
    }

    ion-label {
      color: var(--app-grey-medium);
    }

    &.tab-selected {
      color: var(--voxxrin-event-theme-colors-primary-hex);

      @media (prefers-color-scheme: dark) {
        --background: var(--voxxrin-event-theme-colors-primary-hex);
        color: var(--app-white);
      }

      ion-label {
        color: var(--voxxrin-event-theme-colors-primary-hex);

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }
    }

    ion-icon {
      margin-top: 4px;
      font-size: 26px;
    }
  }
}
</style>
