<template>
  <ion-tabs ref="$tabs" v-if="confDescriptor" v-themed-event-styles="confDescriptor">
    <ion-router-outlet></ion-router-outlet>
    <ion-tab-bar slot="bottom" ref="$tabBarRef">
      <ion-tab-button v-for="(tab, index) in tabs" :key="index"
                      :tab="tab.id" :href="tab.url">
        <ion-icon aria-hidden="true" :src="$tabBarRef?.selectedTab === tab.id ? tab.selectedIcon : tab.icon"/>
        <ion-label>{{ tab.label }}</ion-label>
        <ion-ripple-effect type="unbounded"></ion-ripple-effect>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
</template>

<script setup lang="ts">
import {
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonRouterOutlet,
} from '@ionic/vue';
import {ComponentPublicInstance, PropType, watch} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";

const route = useRoute();

const props = defineProps({
    eventId: {
        required: true,
        type: Object as PropType<EventId>
    },
    tabs: {
        required: true,
        type: Object as PropType<Array<{
            id: string, url: string, label: string, icon: string, selectedIcon: string
        }>>
    }
})

const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(toRef(() => props.eventId));

const { registerTabbedPageNavListeners } = useTabbedPageNav();
registerTabbedPageNavListeners();

const $tabBarRef = ref<ComponentPublicInstance<HTMLIonTabBarElement>|undefined>(undefined);
watch([$tabBarRef], ([$tabBar]) => {
    if($tabBar) {
        // Manually pre-selecting tab because, for whatever reason, it doesn't (always) work
        // (see talk details page for instance..)
        const selectedTabId = (props.tabs.find(t => t.url === route.fullPath) || props.tabs[0]).id;
        const selectedTabIndex = props.tabs?.findIndex(t => t.id === selectedTabId);
        ($tabBar.$el.querySelectorAll(`ion-tab-button`) as HTMLIonTabButtonElement[])[selectedTabIndex].click();
    }
})
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
      letter-spacing: normal;
      color: var(--app-grey-medium);
    }

    &.tab-selected {
      color: var(--voxxrin-event-theme-colors-primary-hex);

      @media (prefers-color-scheme: dark) {
        --background: var(--voxxrin-event-theme-colors-primary-hex);
        color: var(--app-white);
      }

      ion-label {
        font-weight: bold;
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
