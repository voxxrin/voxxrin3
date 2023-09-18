<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <div class="viewsHeader">
            <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                        @click="triggerTabbedPageExitOrNavigate(`/event-selector`)">
              <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
            </ion-button>
            <ion-title class="stickyHeader-title" slot="start">Event configuration</ion-title>
          </div>

          <div class="viewsSubHeader">
            <div class="viewsSubHeader-title">{{ confDescriptor?.headingTitle }}</div>
            <current-event-status :conf-descriptor="confDescriptor"></current-event-status>
          </div>
        </ion-toolbar>
        <img :src="confDescriptor?.backgroundUrl">
      </ion-header>
      <vox-bar-section>
        <template #title>Feature flags</template>
      </vox-bar-section>
      <ion-list>
        <ion-item>
          <ion-toggle color="dark">
            <label><ion-icon src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>Favorites</label>
          </ion-toggle>
        </ion-item>
        <ion-item>
          <ion-toggle color="dark">
            <label><ion-icon src="/assets/icons/solid/video.svg"></ion-icon>Watch later</label>
          </ion-toggle>
        </ion-item>
        <ion-item>
          <ion-toggle color="dark">
            <label><ion-icon src="/assets/icons/solid/map-marker-area.svg"></ion-icon>Rooms</label>
          </ion-toggle>
        </ion-item>
      </ion-list>
      <div class="sectionContainer ion-text-center">
        <ion-button size="small" fill="solid" shape="round" expand="block">
          Trigger crawling <ion-icon slot="end" src="/assets/icons/solid/reload.svg"></ion-icon>
        </ion-button>
        <span>Last crawling :  <strong>00/00/0000 - 00:00:00</strong></span>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter, IonToggle} from "@ionic/vue";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import CurrentEventStatus from "@/components/events/CurrentEventStatus.vue";
import {ref} from "vue";
import VoxBarSection from "@/components/ui/VoxBarSection.vue";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import {useRoute} from "vue-router";
import {goBackOrNavigateTo} from "@/router";

const ionRouter = useIonRouter();
const route = useRoute();

const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const {triggerTabbedPageExitOrNavigate} = useTabbedPageNav();
</script>

<style scoped lang="scss">
ion-header {
  img {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    height: 100%;
    width: 100%;
    z-index: -1;
    object-fit: cover;
  }

  .btnUser {
    height: 48px;
    width: 48px;
    --padding-start: 0;
    --padding-end: 0;
    font-size: 18px;
    --background: rgba(var(--app-white-transparent));
    --border-color: rgba(var(--app-white-transparent));
    --border-width: 1px;

    :deep(ion-icon) {
      color: white;
    }
  }
}
ion-toolbar {
  position: relative;
  --background: linear-gradient(0deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4802) 0%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.98) 52.84%);
  z-index: 1;

  ion-title {
    position: relative;
    padding-inline: 12px;
    text-align: left;
  }

  .viewsHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    font-weight: bold;
    color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
  }

  .viewsSubHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 0;
    font-weight: bold;

    &-title {
      color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
      font-weight: bold;
      font-size: calc(28px + 8 * (100vw - 320px) / 1024)
    }
  }
}

ion-list {
  background: transparent;

  ion-item {
    --padding-start: 0;
    --inner-padding-top: 12px;
    --inner-padding-bottom: 12px;
    --background: transparent;


    ion-toggle {
      &.toggle-checked {
        label {
          font-weight: bold;

          ion-icon {
            --color: var(--voxxrin-event-theme-colors-primary-rgb);
          }
        }
      }

      label {
        display: flex;
        align-items: center;
        padding-left: var(--app-gutters);
        column-gap: 8px;

        ion-icon {
          font-size: 28px;
        }
      }
    }
  }
}

</style>
