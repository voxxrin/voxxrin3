<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <div class="viewsHeader">
        <ion-button class="viewsHeader-back" @click="backButtonClicked" shape="round">
          <ion-icon src="/assets/icons/solid/checkbox-list.svg"></ion-icon>
        </ion-button>
        <global-user-actions-button />
      </div>

      <div class="viewsSubHeader">
        <div class="viewsSubHeader-title">{{ confDescriptor?.headingTitle }}</div>
        <current-event-status :conf-descriptor="confDescriptor"></current-event-status>
      </div>
    </ion-toolbar>
    <img :src="confDescriptor?.backgroundUrl">
  </ion-header>
</template>

<script setup lang="ts">
import {useIonRouter} from "@ionic/vue";
import CurrentEventStatus from "@/components/events/CurrentEventStatus.vue";
import {PropType} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import GlobalUserActionsButton from "@/components/user/GlobalUserActionsButton.vue";

const router = useIonRouter();
const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

const { triggerTabbedPageExitOrNavigate } = useTabbedPageNav()

function backButtonClicked() {
    // Triggering tabbed page's back, and not current tab's
    triggerTabbedPageExitOrNavigate(`/event-selector`);
}

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
      padding-inline: 24px;
    }

    .viewsHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      font-weight: bold;
      color: var(--voxxrin-event-theme-colors-primary-contrast-hex);

      .btnUser {
        border: 1px solid rgba(white, 0.5);
      }
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
</style>
