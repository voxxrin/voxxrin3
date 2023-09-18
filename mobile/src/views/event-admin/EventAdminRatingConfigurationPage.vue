<template>
  <ion-page v-themed-event-styles="confDescriptor">
    <ion-content :fullscreen="true" class="ratingView">
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <div class="viewsHeader">
            <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                        @click="triggerTabbedPageExitOrNavigate(`/event-selector`)">
              <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
            </ion-button>
            <ion-title class="stickyHeader-title" slot="start">Rating configuration</ion-title>
          </div>

          <div class="viewsSubHeader">
            <div class="viewsSubHeader-title">{{ confDescriptor?.headingTitle }}</div>
            <current-event-status :conf-descriptor="confDescriptor"></current-event-status>
          </div>
        </ion-toolbar>
        <img :src="confDescriptor?.backgroundUrl">
      </ion-header>
      <vox-bar-section>
        <template #title>Linear scale</template>
        <template #content>
          <ion-toggle color="dark"></ion-toggle>
        </template>
      </vox-bar-section>
      <div class="sectionContainer">
        <ion-range aria-label="Range with ticks" :ticks="true" :snaps="true" min="0" max="5"></ion-range>
        <ion-row class="ratingStarLevelHead">
          <ion-col size="auto" class="starCol"></ion-col>
          <ion-col><span class="starLabel">Level label</span></ion-col>
        </ion-row>
        <ion-list class="ratingStarLevel">
          <ion-item>
            <ion-row class="ion-align-items-center">
              <ion-col size="auto" class="starNumber">
                <ion-icon src="/assets/icons/solid/star-solid.svg"></ion-icon>
                <span class="starNumber-value">1</span>
              </ion-col>
              <ion-col>
                <ion-input fill="outline" placeholder="Enter text"></ion-input>
              </ion-col>
            </ion-row>
          </ion-item>
          <ion-item>
            <ion-row class="ion-align-items-center">
              <ion-col size="auto" class="starNumber">
                <ion-icon src="/assets/icons/solid/star-solid.svg"></ion-icon>
                <span class="starNumber-value">2</span>
              </ion-col>
              <ion-col>
                <ion-input fill="outline" placeholder="Enter text"></ion-input>
              </ion-col>
            </ion-row>
          </ion-item>
          <ion-item>
            <ion-row class="ion-align-items-center">
              <ion-col size="auto" class="starNumber">
                <ion-icon src="/assets/icons/solid/star-solid.svg"></ion-icon>
                <span class="starNumber-value">3</span>
              </ion-col>
              <ion-col>
                <ion-input fill="outline" placeholder="Enter text"></ion-input>
              </ion-col>
            </ion-row>
          </ion-item>
        </ion-list>
      </div>

      <vox-bar-section>
        <template #title>Custom scale</template>
        <template #content>
          <ion-toggle color="dark"></ion-toggle>
        </template>
      </vox-bar-section>

      <ul class="scaleList">
        <li class="scaleList-item">
          <span class="scaleList-item-add">😃</span>
          <span class="scaleList-item-delete" v-if="true">
            <ion-icon aria-hidden="true" src="/assets/icons/line/close-line.svg"></ion-icon>
          </span>
        </li>

        <li class="scaleList-item" :class="{'_empty': true}">
          <span class="scaleList-item-add">
            <ion-icon aria-hidden="true" src="/assets/icons/line/plus-line.svg"></ion-icon>
          </span>
          <span class="scaleList-item-delete" v-if="false">
            <ion-icon aria-hidden="true" src="/assets/icons/line/close-line.svg"></ion-icon>
          </span>
        </li>
      </ul>

      <vox-bar-section>
        <template #title>Bingo</template>
        <template #content>
          <ion-toggle color="dark"></ion-toggle>
        </template>
      </vox-bar-section>

      <vox-bar-section>
        <template #title>Free comment</template>
        <template #content>
          <ion-toggle color="dark"></ion-toggle>
        </template>
      </vox-bar-section>
    </ion-content>

    <ion-fab  slot="fixed" horizontal="end" vertical="bottom">
      <ion-fab-button>
        <ion-icon src="/assets/icons/line/eye-line.svg"></ion-icon>
      </ion-fab-button>
    </ion-fab>
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

const ionRouter = useIonRouter();
const route = useRoute();

const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const secretOrganizerToken = ref(getRouteParamsValue(route, 'secretOrganizerToken'));

const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const {triggerTabbedPageExitOrNavigate} = useTabbedPageNav();
</script>

<style lang="scss" scoped>
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

.ratingView  {
  --padding-bottom: 74px;
}

ion-range {
  margin: 0 8px;
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

.ratingStarLevelHead {
  margin-top: 16px;

  ion-col {
    padding-top: 0;
    padding-bottom: 0;
  }

  .starCol {
    width: 54px !important;
  }

  .starLabel {
    font-weight: 900;
    font-size: 13px;
    color: var(--app-grey-dark);
  }
}

.ratingStarLevel {
  ion-item {
    --inner-padding-top: 4px;
    --inner-padding-bottom: 4px;
    --inner-padding-end: 0;

    &:last-child {
      --inner-border-width: 0;
    }

    ion-row {
      width: 100%;
    }
  }

  .starNumber {
    position: relative;

    ion-icon {
      color: var(--voxxrin-event-theme-colors-primary-rgb);
      font-size: 44px;
    }

    &-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: 900;
      color: var(--app-white);
    }
  }
}

.scaleList {
  display: flex;
  flex-direction: row;
  align-items: start;
  column-gap: 16px;
  margin: 0;
  padding: 16px;
  overflow-y: auto;

  &-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 8px;
    justify-content: center;
    list-style: none;

    &._empty {
      .scaleList-item-add {
        background: transparent;
        border: 2px dashed var(--app-beige-line);

        ion-icon {
          color: var(--app-beige-line);
        }
      }
    }

    &-add {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 54px;
      line-height: 1;
      height: 74px;
      width: 74px;
      border-radius: 74px;
      background: var(--app-beige-medium);
      border: 3px solid var(--voxxrin-event-theme-colors-primary-rgb);
    }

    &-delete {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 34px;
      width: 34px;
      border-radius: 34px;
      border: 2px solid var(--app-primary);

      ion-icon {
        font-size: 22px;
      }
    }
  }
}
</style>
