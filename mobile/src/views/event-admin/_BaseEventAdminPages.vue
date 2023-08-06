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
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";

const router = useIonRouter();
const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

const tabs = [{
  id: 'event-config', url: `/events/${eventId.value.value}/asOrganizer/${secretOrganizerToken.value}/config`, label: LL.value.Config(),
  icon: '/assets/icons/line/settings-cog-line.svg',
  selectedIcon: '/assets/icons/solid/settings-cog.svg',
}, {
  id: 'talks-config', url: `/events/${eventId.value.value}/asOrganizer/${secretOrganizerToken.value}/talks-config`, label: LL.value.Talks_Config(),
    icon: '/assets/icons/line/calendar-line.svg',
    selectedIcon: '/assets/icons/solid/calendar.svg',
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
